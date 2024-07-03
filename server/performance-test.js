import { sleep } from "bun";

const url = "https://biblesearch.app/api/search?q=god%20love";
const totalRequests = 100;
const requestDelay = 10; // in milliseconds

async function makeRequest(requestNumber) {
  const startTime = performance.now();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    console.log(`Request ${requestNumber}: ${responseTime.toFixed(2)}ms`);
    return responseTime;
  } catch (error) {
    console.error(`Request ${requestNumber} failed:`, error);
    return null;
  }
}

async function runRequests() {
  const responseTimes = [];

  for (let i = 1; i <= totalRequests; i++) {
    const responseTime = await makeRequest(i);
    if (responseTime !== null) {
      responseTimes.push(responseTime);
    }

    if (i < totalRequests) {
      await sleep(requestDelay);
    }
  }

  // Calculate and display statistics
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    console.log(`\nStatistics:`);
    console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Minimum response time: ${minResponseTime.toFixed(2)}ms`);
    console.log(`Maximum response time: ${maxResponseTime.toFixed(2)}ms`);
  } else {
    console.log("No successful requests were made.");
  }
}

runRequests();
