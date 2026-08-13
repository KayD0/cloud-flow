export type NodeKind =
  | "client"
  | "server"
  | "load-balancer"
  | "database"
  | "cache"
  | "queue"
  | "gateway"
  | "storage"
  | "firewall";

export type NodeStatus =
  | "healthy"
  | "processing"
  | "warning"
  | "down"
  | "scaling"
  | "promoting";

export interface InfrastructureNode {
  id: string;
  kind: NodeKind;
  label: string;
  status: NodeStatus;
  metadata?: Readonly<Record<string, string | number | boolean>>;
}

export type ConnectionKind =
  | "http"
  | "https"
  | "tcp"
  | "replication"
  | "async-message"
  | "request-response";

export interface Connection {
  id: string;
  from: InfrastructureNode["id"];
  to: InfrastructureNode["id"];
  kind: ConnectionKind;
  network: "public" | "private";
}

export interface RegionBoundary {
  id: string;
  label: string;
  kind: "region" | "availability-zone" | "vpc" | "vnet" | "subnet";
  nodeIds: readonly InfrastructureNode["id"][];
}

export interface ScenarioDefinition {
  id: string;
  label: string;
  kind:
    | "request-flow"
    | "load-balancing"
    | "cache"
    | "queue"
    | "replication"
    | "failover"
    | "auto-scaling";
}

export interface ScenarioControls {
  playback: "idle" | "running" | "paused";
  speed: number;
  traffic: number;
}
