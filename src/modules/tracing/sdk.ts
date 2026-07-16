import "dotenv/config";

import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { AggregationTemporality, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

const otlpBaseEndpoint = process.env.OTLP_ENDPOINT || "http://localhost:4318";

const otlpHeaders = process.env.SIGNOZ_ACCESS_TOKEN
	? { "signoz-ingestion-key": process.env.SIGNOZ_ACCESS_TOKEN }
	: undefined;

if (process.env.NODE_ENV === "production") {
	diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

	const sdk = new NodeSDK({
		resource: resourceFromAttributes({
			[ATTR_SERVICE_NAME]: process.env.JAEGER_SERVICE_NAME || "okami",
			[ATTR_SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
		}),
		autoDetectResources: true,
		traceExporter: new OTLPTraceExporter({
			url: process.env.JAEGER_ENDPOINT || `${otlpBaseEndpoint}/v1/traces`,
			headers: otlpHeaders,
		}),
		metricReader: new PeriodicExportingMetricReader({
			exporter: new OTLPMetricExporter({
				url: `${otlpBaseEndpoint}/v1/metrics`,
				headers: otlpHeaders,
				temporalityPreference: AggregationTemporality.DELTA,
			}),
		}),
		logRecordProcessors: [
			new BatchLogRecordProcessor(
				new OTLPLogExporter({
					url: `${otlpBaseEndpoint}/v1/logs`,
					headers: otlpHeaders,
				}),
			),
		],
		instrumentations: [getNodeAutoInstrumentations()],
	});

	sdk.start();

	const shutdown = async () => {
		try {
			await sdk.shutdown();
		} catch (err) {
			console.error("Erro ao finalizar OpenTelemetry", err);
		} finally {
			process.exit(0);
		}
	};

	process.once("SIGINT", shutdown);
	process.once("SIGTERM", shutdown);
}
