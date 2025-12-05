# Incident: 2025-12-05 10-20-00

## Summary

Between the hour of 09:30 and 10:20 on 12/05/25, our users encountered an inability to order pizzas. The event was triggered by a factory configuration change the night before. The factory configuration contained instructions to test the system in a chaotic way the following morning which brought down parts of the system.

A bug in this code caused all users to be without the ability to order pizzas rather than just a few. The event was detected by our Grafana OnCall system. The team started working on the event by 10:10. This critical incident affected 100% of users ordering pizzas.

## Detection

This incident was detected when the Grafana OnCall was triggered and Porter Nilsson was paged.

In the future, simulation traffic should have been run continuously even during times of low load, thus the issue might have been detected earlier.

## Impact

For an indeterminate number of minutes between 08:00 and 10:20 in the morning on 12/05/25, our users experienced the inability to finalize their orders. This affected most customers (100% of users attempting to order pizzas), who experienced a failure error message upon attempting to order click the order button at the end of the payment flow.

## Timeline

All times are UTC.

- *5:10* - Simulation traffic monitoring commences and notices an abnormal number of pizza orders failing to be created.
- *5:15* - Technicians try to manually order a pizza and experience the failure firsthand
- *5:19* - Technicians checked the logs to find the the root cause
- *5:20* - Root cause is immediately identified and resolved

## Response

After receiving a page at 05:10, Porter Nilsson came online at 05:15 to the Grafana dashboard.

## Root cause

The root cause of the issue was the pizza factory was failing to create pizza orders. It was responding to our systems with a failure response which was logged in Grafana.

## Resolution

Upon inspection of the response bodies coming from the factory in the logs, it was clear that technicians needed to follow a link to end the outage and allow users to resume ordering pizzas. To decrease this time in the future, we could ensure that all errors are logged with their response messages front-and-center. To determine that the service was completely restored, technicians continued simulating traffic to see that all responses were within normal alert limits.

## Prevention

This is the first incidence of this type of failure occurring. Ultimately, this suggests that the pizza factory has the potential to be unreliable. In the future, we could attempt to add an additional factory for failover or retry attempts when a failure does occur.

## Action items

The corrective action being taken to present this class of failure in the future is twofold. First, we are calling the factory to check with them as to why failures were occurring in this manner. Secondarily, we are adding code to retry when a failed order does occur. Thus, the retries will inflate our failed creation percentage more should this happen again which will ensure an even swifter response. Porter Nilsson is in charge of both of these changes.