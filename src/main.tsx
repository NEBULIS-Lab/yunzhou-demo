import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import {
  ContactMarkers,
  Debug,
  DragInteraction,
  IkGizmo,
  MujocoCanvas,
  MujocoProvider,
  useGravityCompensation,
  useIkController,
  useMujoco,
  useSelectionHighlight,
} from 'mujoco-react';
import type { IkConfig, MujocoSimAPI } from 'mujoco-react';
import { robots } from './configs';
import { FrankaController } from './controllers/FrankaController';
import { SO101Controller } from './controllers/SO101Controller';
import { XLeRobotController } from './controllers/XLeRobotController';
import { useClickSelect } from './useClickSelect';
import './styles.css';

type RobotKey = 'franka' | 'so101' | 'xlerobot';

function LoadingOverlay() {
  const sim = useMujoco();
  if (sim.isReady) return null;
  return (
    <Html center>
      <div className="loading-card">
        {sim.isError ? (
          <span>{sim.error}</span>
        ) : (
          <>
            <div className="spinner" />
            <span>正在加载 MuJoCo 机械臂模型...</span>
          </>
        )}
      </div>
    </Html>
  );
}

function GravityCompensation({ enabled }: { enabled: boolean }) {
  useGravityCompensation(enabled);
  return null;
}

function ClickSelectOverlay() {
  const selectedBodyId = useClickSelect();
  useSelectionHighlight(selectedBodyId);
  return null;
}

function SceneControllers({
  robotKey,
  ikConfig,
  showGizmo,
  gizmoScale,
}: {
  robotKey: RobotKey;
  ikConfig: IkConfig | null;
  showGizmo: boolean;
  gizmoScale?: number;
}) {
  const ik = useIkController(ikConfig);

  return (
    <>
      {ik && showGizmo && <IkGizmo controller={ik} scale={gizmoScale} />}
      {robotKey === 'franka' && <FrankaController />}
      {robotKey === 'so101' && <SO101Controller ik={ik} />}
      {robotKey === 'xlerobot' && <XLeRobotController ik={ik} />}
    </>
  );
}

function MujocoArmPanel() {
  const apiRef = useRef<MujocoSimAPI>(null);
  const [robotKey, setRobotKey] = useState<RobotKey>('franka');
  const [paused, setPaused] = useState(false);
  const [gravityCompensation, setGravityCompensation] = useState(false);
  const [showGizmo, setShowGizmo] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  const entry = robots[robotKey];
  const canvasKey = useMemo(() => robotKey, [robotKey]);
  const ikConfig = entry.hasIk && entry.ikConfig ? entry.ikConfig : null;

  return (
    <section className="arm-panel">
      <div className="arm-toolbar">
        <div>
          <strong>真实机械臂仿真</strong>
          <span>Franka / SO101 / XLeRobot 模型</span>
        </div>
        <div className="toolbar-controls">
          <select value={robotKey} onChange={(event) => setRobotKey(event.target.value as RobotKey)}>
            <option value="franka">Franka Panda</option>
            <option value="so101">SO101</option>
            <option value="xlerobot">XLeRobot</option>
          </select>
          <button onClick={() => apiRef.current?.reset()}>重置机械臂</button>
          <button className={paused ? 'active' : ''} onClick={() => setPaused((value) => !value)}>
            {paused ? '继续' : '暂停'}
          </button>
        </div>
      </div>

      <div className="mujoco-frame">
        <MujocoProvider>
          <MujocoCanvas
            key={canvasKey}
            ref={apiRef}
            config={entry.config}
            camera={{
              position: entry.camera.position,
              up: [0, 0, 1],
              fov: entry.camera.fov,
              near: 0.01,
              far: 100,
            }}
            paused={paused}
            speed={1}
            shadows
            style={{ width: '100%', height: '100%' }}
          >
            <OrbitControls enableDamping dampingFactor={0.1} target={entry.orbitTarget} makeDefault />
            <LoadingOverlay />
            <GravityCompensation enabled={gravityCompensation} />
            <SceneControllers
              robotKey={robotKey}
              ikConfig={ikConfig}
              showGizmo={showGizmo}
              gizmoScale={entry.gizmoScale}
            />
            <DragInteraction />
            <ClickSelectOverlay />
            <ContactMarkers visible={showDebug} />
            <Debug showSites={showDebug} showJoints={showDebug} />
            <Environment preset="lobby" environmentIntensity={0.55} />
            <ambientLight intensity={0.42} />
            <directionalLight position={[2, -2, 5]} intensity={1.5} castShadow />
            <directionalLight position={[-1, 1, 3]} intensity={0.35} />
            <gridHelper args={[4, 40, '#64748b', '#94a3b8']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.001]} />
          </MujocoCanvas>
        </MujocoProvider>
      </div>

      <div className="arm-footer">
        <label>
          <input
            type="checkbox"
            checked={gravityCompensation}
            onChange={(event) => setGravityCompensation(event.target.checked)}
          />
          重力补偿
        </label>
        <label>
          <input type="checkbox" checked={showGizmo} onChange={(event) => setShowGizmo(event.target.checked)} />
          IK 控制器
        </label>
        <label>
          <input type="checkbox" checked={showDebug} onChange={(event) => setShowDebug(event.target.checked)} />
          调试标记
        </label>
      </div>
    </section>
  );
}

function App() {
  const oceanUrl = `${import.meta.env.BASE_URL}ocean.html`;
  const [showArmPanel, setShowArmPanel] = useState(true);

  return (
    <main className="app-shell">
      <iframe className="ocean-scene" src={oceanUrl} title="云洲无人艇海洋环境" />
      <button className="arm-visibility-toggle" onClick={() => setShowArmPanel((value) => !value)}>
        {showArmPanel ? '隐藏机械臂仿真' : '显示机械臂仿真'}
      </button>
      <div className="top-note">
        <strong>云洲无人艇海洋作业演示</strong>
        <span>高细节海洋场景 + MuJoCo 真实机械臂仿真</span>
      </div>
      {showArmPanel && <MujocoArmPanel />}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
