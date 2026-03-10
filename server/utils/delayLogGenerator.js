import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads the cargo CSV dataset and filters for delayed shipments
 * @returns {Promise<Array>} Array of delayed shipment records
 */
async function readAndFilterDelayedShipments() {
  const csvPath = path.join(__dirname, '../cargo2000.csv');
  const records = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        records.push(row);
      })
      .on('end', () => {
        // Filter for delayed shipments: o_dlv_e > o_dlv_p
        const delayedShipments = records.filter(record => {
          const plannedDelivery = parseInt(record.o_dlv_p, 10);
          const actualDelivery = parseInt(record.o_dlv_e, 10);
          
          return !isNaN(plannedDelivery) && !isNaN(actualDelivery) && actualDelivery > plannedDelivery;
        });

        resolve(delayedShipments);
      })
      .on('error', reject);
  });
}

/**
 * Extracts route information from shipment record
 * @param {Object} record - Shipment record
 * @returns {String} Formatted route string
 */
function extractRoute(record) {
  const hubs = [];
  
  // Collect origin hub from o_dep_1_place
  if (record.o_dep_1_place && record.o_dep_1_place !== '?') {
    hubs.push(`H${record.o_dep_1_place}`);
  }
  
  // Collect intermediate hubs
  if (record.o_rcf_1_place && record.o_rcf_1_place !== '?') {
    hubs.push(`H${record.o_rcf_1_place}`);
  }
  if (record.o_rcf_2_place && record.o_rcf_2_place !== '?') {
    hubs.push(`H${record.o_rcf_2_place}`);
  }
  if (record.o_rcf_3_place && record.o_rcf_3_place !== '?') {
    hubs.push(`H${record.o_rcf_3_place}`);
  }
  
  return hubs.length > 0 ? hubs.join(' → ') : 'Unknown Route';
}

/**
 * Determines delivery zone based on hub ID
 * @param {String} hubId - Hub identifier
 * @returns {String} Zone type (Metropolitan/Non-Metropolitan)
 */
function determineDeliveryZone(hubId) {
  // Metro hubs: 100-300, Non-Metro: 300+
  const hubNum = parseInt(hubId, 10);
  if (isNaN(hubNum)) return 'Non-Metropolitan';
  return hubNum < 300 ? 'Metropolitan' : 'Non-Metropolitan';
}

/**
 * Generates realistic simulated values for missing fields
 * @param {Object} record - Shipment record
 * @returns {Object} Simulated operational context
 */
function generateOperationalContext(record) {
  const plannedDelivery = parseInt(record.o_dlv_p, 10);
  const actualDelivery = parseInt(record.o_dlv_e, 10);
  const delayDuration = actualDelivery - plannedDelivery;
  
  // Extract destination hub for zone determination
  const destHub = record.o_rcf_3_place || record.o_rcf_2_place || record.o_rcf_1_place || record.o_dep_1_place || '500';
  const deliveryZone = determineDeliveryZone(destHub);
  
  // Simulate weight based on delay duration (heavier shipments may take longer)
  const weight = Math.floor(Math.random() * 45) + 5; // 5-50 kg
  
  // Order type: Prepaid (70%) or COD (30%)
  const orderType = Math.random() < 0.7 ? 'Prepaid' : 'COD';
  
  // SLA: Standard (60%), Express (30%), Overnight (10%)
  const slaRand = Math.random();
  let sla = 'Standard';
  if (slaRand < 0.1) sla = 'Overnight';
  else if (slaRand < 0.4) sla = 'Express';
  
  // Check if Sunday is between planned and actual delivery
  // Simplified: if delay > 1000 units, likely spans a weekend
  const sundayInBetween = delayDuration > 1000 ? 'Yes' : 'No';
  
  // Holiday check: simplified based on delay patterns
  const holidayInBetween = delayDuration > 2000 ? 'Yes' : 'No';
  
  return {
    deliveryZone,
    weight,
    orderType,
    sla,
    sundayInBetween,
    holidayInBetween,
  };
}

/**
 * Detects delay reasons with improved logic
 * @param {Object} record - Shipment record
 * @param {Number} delayDuration - Delay in time units
 * @param {Object} context - Operational context
 * @returns {Array} Array of 2-3 meaningful delay reasons
 */
function detectDelayReasons(record, delayDuration, context) {
  const reasons = [];
  const scores = {};
  
  // Signal 1: High number of transit hops
  const hops = parseInt(record.o_hops, 10);
  if (!isNaN(hops) && hops > 2) {
    scores['Multiple Transit Hops'] = hops > 3 ? 3 : 2;
  }
  
  // Signal 2: Long delay duration
  if (delayDuration > 2000) {
    scores['Extended Transit Delay'] = 3;
  } else if (delayDuration > 1000) {
    scores['Significant Delay'] = 2;
  }
  
  // Signal 3: Weekend in between
  if (context.sundayInBetween === 'Yes') {
    scores['Weekend Operational Pause'] = 2;
  }
  
  // Signal 4: Non-metro delivery zone
  if (context.deliveryZone === 'Non-Metropolitan') {
    scores['Remote Delivery Zone'] = 1;
  }
  
  // Signal 5: SLA breach
  if (context.sla === 'Express' || context.sla === 'Overnight') {
    if (delayDuration > 500) {
      scores['SLA Breach'] = 3;
    }
  }
  
  // Signal 6: Holiday in between
  if (context.holidayInBetween === 'Yes') {
    scores['Holiday Operational Disruption'] = 2;
  }
  
  // Signal 7: COD orders (higher handling complexity)
  if (context.orderType === 'COD' && delayDuration > 800) {
    scores['COD Processing Delay'] = 2;
  }
  
  // Sort by score and take top 2-3 reasons
  const sortedReasons = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason]) => reason);
  
  return sortedReasons.length > 0 ? sortedReasons : ['Delay Reason Under Investigation'];
}

/**
 * Generates a structured delay log from a shipment record
 * @param {Object} record - Shipment record
 * @param {Object} context - Operational context
 * @returns {String} Formatted structured delay log
 */
function formatStructuredDelayLog(record, context) {
  const legId = record.o_legid || 'UNKNOWN';
  const plannedDelivery = parseInt(record.o_dlv_p, 10) || 0;
  const actualDelivery = parseInt(record.o_dlv_e, 10) || 0;
  const delayDuration = actualDelivery - plannedDelivery;
  const hops = record.o_hops || '0';
  const legs = record.legs || '1';
  const route = extractRoute(record);
  const originHub = record.o_dep_1_place || '?';
  
  const log = `LOG-${legId} | STATUS: DELAYED

Shipment Overview
  Origin Hub: H${originHub}
  Route: ${route}
  Transit Hops: ${hops}
  Shipment Legs: ${legs}

Delivery Timing
  Planned Delivery Time: ${plannedDelivery}
  Actual Delivery Time: ${actualDelivery}
  Delay Duration: ${delayDuration} time units

Operational Context
  Delivery Zone: ${context.deliveryZone}
  Shipment Weight: ${context.weight} kg
  Order Type: ${context.orderType}
  Service Level Agreement (SLA): ${context.sla}
  Sunday In Between: ${context.sundayInBetween}
  Holiday In Between: ${context.holidayInBetween}`;
  
  return log;
}

/**
 * Main function: Generates a structured delay log with reasons
 * @returns {Promise<Object>} Object with log string and delay reasons array
 */
async function generateDelayLog() {
  try {
    const delayedShipments = await readAndFilterDelayedShipments();
    
    if (delayedShipments.length === 0) {
      return {
        log: 'No delayed shipments found in dataset',
        delayReasons: [],
      };
    }
    
    // Randomly select one delayed shipment
    const randomIndex = Math.floor(Math.random() * delayedShipments.length);
    const selectedShipment = delayedShipments[randomIndex];
    
    // Calculate delay duration
    const delayDuration = parseInt(selectedShipment.o_dlv_e, 10) - parseInt(selectedShipment.o_dlv_p, 10);
    
    // Generate operational context
    const context = generateOperationalContext(selectedShipment);
    
    // Generate structured log
    const log = formatStructuredDelayLog(selectedShipment, context);
    
    // Detect delay reasons with improved logic
    const delayReasons = detectDelayReasons(selectedShipment, delayDuration, context);
    
    return {
      log,
      delayReasons,
    };
  } catch (error) {
    console.error('Error generating delay log:', error);
    return {
      log: 'Error generating delay log',
      delayReasons: ['System error'],
    };
  }
}

export { generateDelayLog, readAndFilterDelayedShipments, extractRoute, detectDelayReasons, formatStructuredDelayLog, generateOperationalContext };
