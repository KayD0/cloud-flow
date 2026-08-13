import template11 from "./traffic-routing/request-response-flow";
import template12 from "./traffic-routing/round-robin-load-balancing";
import template13 from "./traffic-routing/weighted-routing";
import template14 from "./traffic-routing/host-path-based-routing";
import template15 from "./traffic-routing/dns-resolution-and-failover";
import template16 from "./network-connectivity/public-private-subnet-connectivity";
import template17 from "./network-connectivity/vpc-vnet-peering";
import template18 from "./network-connectivity/site-to-site-vpn-connectivity";
import template19 from "./network-connectivity/private-link-private-endpoint";
import template20 from "./network-connectivity/internet-gateway-and-nat-gateway";
import template21 from "./compute-scaling/vm-auto-scaling";
import template22 from "./compute-scaling/container-lifecycle";
import template23 from "./compute-scaling/kubernetes-pod-scheduling";
import template24 from "./compute-scaling/kubernetes-rolling-update";
import template25 from "./compute-scaling/serverless-function-scaling";
import template26 from "./data-storage/database-read-write";
import template27 from "./data-storage/cache-hit-miss";
import template28 from "./data-storage/primary-and-read-replica";
import template29 from "./data-storage/object-block-file-storage";
import template30 from "./data-storage/backup-restore";
import template31 from "./messaging-integration/work-queue";
import template32 from "./messaging-integration/pub-sub-fan-out";
import template33 from "./messaging-integration/event-bus-routing";
import template34 from "./messaging-integration/stream-consumer-lag";
import template35 from "./messaging-integration/retry-and-dead-letter-queue";
import template36 from "./reliability-recovery/health-check-isolation-and-rejoin";
import template37 from "./reliability-recovery/timeout-and-bounded-retry";
import template38 from "./reliability-recovery/circuit-breaker";
import template39 from "./reliability-recovery/active-standby-multi-az-failover";
import template40 from "./reliability-recovery/database-replica-promotion";
import template41 from "./security/firewall-allow-deny";
import template42 from "./security/waf-request-inspection";
import template43 from "./security/security-group-rule-evaluation";
import template44 from "./security/authentication-and-authorization";
import template45 from "./security/secrets-and-credential-rotation";
import template46 from "./observability-operations/metrics-pipeline";
import template47 from "./observability-operations/logs-pipeline";
import template48 from "./observability-operations/distributed-tracing";
import template49 from "./observability-operations/metrics-traces-and-logs-correlation";
import template50 from "./observability-operations/slo-and-error-budget-alert";

export const catalogTemplates = [
  template11,
  template12,
  template13,
  template14,
  template15,
  template16,
  template17,
  template18,
  template19,
  template20,
  template21,
  template22,
  template23,
  template24,
  template25,
  template26,
  template27,
  template28,
  template29,
  template30,
  template31,
  template32,
  template33,
  template34,
  template35,
  template36,
  template37,
  template38,
  template39,
  template40,
  template41,
  template42,
  template43,
  template44,
  template45,
  template46,
  template47,
  template48,
  template49,
  template50,
] as const;
