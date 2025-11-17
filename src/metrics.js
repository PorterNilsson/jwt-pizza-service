const config = require("./config");
const os = require("os");

const requests = {};

let activeUsers = 0;

let successfulLogins = 0;
let failedLogins = 0;

let pizzasSold = 0;
let pizzaCreationFailures = 0;
let totalRevenue = 0;

let backendLatencies = [];
let factoryLatencies = [];

function requestTracker(req, res, next) {
  const method = req.method;
  requests[method] = (requests[method] || 0) + 1;
  next();
}

function incrementActiveUsers() {
  activeUsers++;
}

function decrementActiveUsers() {
  activeUsers--;
}

function incrementSuccessfulLogins() {
  successfulLogins++;
}

function incrementFailedLogins() {
  failedLogins++;
}

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

function updatePizzasSold(order) {
  if (!order || !order.items) return;

  pizzasSold += order.items.length;

  const orderTotal = order.items.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );
  totalRevenue += orderTotal;

  // console.log(`Updated metrics: pizzasSold=${pizzasSold}, totalRevenue=${totalRevenue.toFixed(4)}`);
}

function incrementPizzaCreationFailures() {
  pizzaCreationFailures++;
}

function recordBackendLatency(durationMs) {
  backendLatencies.push(durationMs);
}

function recordFactoryLatency(durationMs) {
  factoryLatencies.push(durationMs);
}

// This will periodically send metrics to Grafana
function startMetrics() {
  setInterval(async () => {
    // console.log("SENDING METRICS!!!!!");

    const metrics = [];
    Object.keys(requests).forEach((method) => {
      metrics.push(
        createMetric("requests", requests[method], "1", "sum", "asInt", {
          method,
        })
      );
    });

    metrics.push(
      createMetric("activeUsers", activeUsers, "1", "gauge", "asInt", {})
    );

    metrics.push(
      createMetric(
        "successfulLogins",
        successfulLogins,
        "1",
        "sum",
        "asInt",
        {}
      )
    );
    metrics.push(
      createMetric("failedLogins", failedLogins, "1", "sum", "asInt", {})
    );

    metrics.push(
      createMetric(
        "cpuUsage",
        getCpuUsagePercentage(),
        "%",
        "gauge",
        "asDouble",
        {}
      )
    );
    metrics.push(
      createMetric(
        "memoryUsage",
        getMemoryUsagePercentage(),
        "%",
        "gauge",
        "asDouble",
        {}
      )
    );

    metrics.push(
      createMetric("pizzasSold", pizzasSold, "1", "sum", "asInt", {})
    );
    metrics.push(
      createMetric(
        "pizzaCreationFailures",
        pizzaCreationFailures,
        "1",
        "sum",
        "asInt",
        {}
      )
    );
    metrics.push(
      createMetric("totalRevenue", totalRevenue, "1", "sum", "asDouble", {})
    );

    if (backendLatencies.length > 0) {
      const sum = backendLatencies.reduce((a, b) => a + b, 0);
      const avg = sum / backendLatencies.length;
      metrics.push(
        createMetric(
          "backendLatency",
          avg.toFixed(2),
          "ms",
          "gauge",
          "asDouble",
          {}
        )
      );
      backendLatencies = [];
    }

    if (factoryLatencies.length > 0) {
      const sum = factoryLatencies.reduce((a, b) => a + b, 0);
      const avg = sum / factoryLatencies.length;
      metrics.push(
        createMetric(
          "factoryLatency",
          avg.toFixed(2),
          "ms",
          "gauge",
          "asDouble",
          {}
        )
      );
      factoryLatencies = [];
    }

    await sendMetricToGrafana(metrics);
  }, 10000);
}

function createMetric(
  metricName,
  metricValue,
  metricUnit,
  metricType,
  valueType,
  attributes
) {
  attributes = { ...attributes, source: config.metrics.source };

  const metric = {
    name: metricName,
    unit: metricUnit,
    [metricType]: {
      dataPoints: [
        {
          [valueType]: metricValue,
          timeUnixNano: Date.now() * 1000000,
          attributes: [],
        },
      ],
    },
  };

  Object.keys(attributes).forEach((key) => {
    metric[metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  if (metricType === "sum") {
    metric[metricType].aggregationTemporality =
      "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric[metricType].isMonotonic = true;
  }

  return metric;
}

async function sendMetricToGrafana(metrics) {
  const body = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(`${config.metrics.url}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${config.metrics.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP status ${response.status}: ${text}`);
    }
  } catch (error) {
    console.error("Error pushing metrics:", error);
  }
}

module.exports = {
  requestTracker,
  incrementActiveUsers,
  decrementActiveUsers,
  incrementSuccessfulLogins,
  incrementFailedLogins,
  updatePizzasSold,
  incrementPizzaCreationFailures,
  recordBackendLatency,
  recordFactoryLatency,
  startMetrics,
};
