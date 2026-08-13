"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./serverless-function-scaling-demo.module.css";

export function ServerlessFunctionScalingDemo() {
  const [stage, setStage] = useState(0);
  const isDeploying = stage === 1 || stage === 3 || stage === 5;
  const isFiring = stage === 2 || stage === 4 || stage === 6;
  const isRecalling = stage === 7;
  const deployedCount = stage === 0 ? 0 : stage <= 2 ? 2 : stage <= 4 ? 4 : 6;
  const deployingFrom = isDeploying ? deployedCount - 2 : deployedCount;
  const firingCount = isFiring ? deployedCount : 0;
  const visibleEnemyLanes = isFiring ? Array.from({ length: deployedCount }, (_, index) => index) : [];
  const displayedHostiles = visibleEnemyLanes.length;
  const eliminatedCount = stage <= 2 ? 0 : stage <= 4 ? 2 : stage <= 6 ? 4 : 6;

  useEffect(() => {
    const duration = stage === 0 ? 700 : isDeploying ? 1500 : isFiring ? 1800 : 1200;
    const timer = window.setTimeout(() => setStage((current) => (current + 1) % 8), duration);
    return () => window.clearTimeout(timer);
  }, [isDeploying, isFiring, stage]);

  return (
    <section className={styles.demo} aria-labelledby="serverless-scaling-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>TEMPLATE PREVIEW</p>
          <h2 id="serverless-scaling-title">Serverless Defense Grid</h2>
        </div>
        <div className={styles.hud} aria-label={`${displayedHostiles} events incoming, ${deployedCount} functions deployed`}>
          <span>HOSTILES <strong>{displayedHostiles}</strong></span>
          <span>TOWERS <strong>{deployedCount}/6</strong></span>
        </div>
      </header>

      <div className={styles.game} data-stage={stage}>
        <div className={styles.terrain} aria-hidden="true" />
        <div className={styles.core} aria-label="Protected service endpoint">
          <i aria-hidden="true" />
          <span>API CORE</span>
        </div>

        {isDeploying && (
          <div className={styles.deployStream} aria-hidden="true">
            {Array.from({ length: 2 }, (_, index) => <i key={index} />)}
          </div>
        )}

        <div className={styles.enemyLanes} aria-label={`${displayedHostiles} incoming events`}>
          {visibleEnemyLanes.map((lane) => (
            <span
              key={`${stage}-${lane}`}
              className={styles.enemy}
              data-lane={lane}
              data-targeted="true"
              aria-hidden="true"
            >
              <i />
            </span>
          ))}
        </div>

        <div className={styles.projectiles} aria-hidden="true">
          {Array.from({ length: deployedCount }, (_, index) => (
            <i key={index} style={{ "--tower": index } as CSSProperties} data-active={index < firingCount} />
          ))}
        </div>

        <div className={styles.towers} aria-label={`${deployedCount} function defense towers`}>
          {Array.from({ length: 6 }, (_, index) => {
            const deployed = index < deployedCount;
            const cold = deployed && isDeploying && index >= deployingFrom;
            return (
              <article
                key={index}
                className={styles.tower}
                data-state={!deployed ? "standby" : isRecalling ? "recalling" : cold ? "booting" : index < firingCount ? "firing" : "warm"}
                style={{ "--tower": index } as CSSProperties}
              >
                <span className={styles.turret} aria-hidden="true"><i /><b /></span>
                <small>FN-{String(index + 1).padStart(2, "0")}</small>
              </article>
            );
          })}
        </div>

        <div className={styles.command} role="status">
          <span>API CORE / AUTO DEPLOY</span>
          <strong>
            {isRecalling ? "RECALLING ALL 6 TOWERS"
              : isDeploying ? `DEPLOYING 2 TOWERS · ${deployedCount}/6`
              : isFiring ? `FIRING SEQUENCE · ${firingCount}/6`
                : "SCANNING PERIMETER"}
          </strong>
        </div>
      </div>

      <div className={styles.readout}>
        <div><span>EVENT WAVE</span><strong>{isFiring ? 2 : 0}</strong></div>
        <div><span>ELIMINATED</span><strong>{eliminatedCount}</strong></div>
        <div><span>DEPLOYMENT STAGE</span><strong>{deployedCount === 0 ? "0" : deployedCount === 2 ? "0 → 2" : deployedCount === 4 ? "0 → 2 → 4" : "0 → 2 → 4 → 6"}</strong></div>
        <div><span>CONCURRENCY CAP</span><strong>6</strong></div>
      </div>
    </section>
  );
}
