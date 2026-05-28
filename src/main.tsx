import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useFrame } from '@react-three/fiber';
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

function FrankaPickPlaceDemo({
  runId,
  robotKey,
  onDone,
}: {
  runId: number;
  robotKey: RobotKey;
  onDone: () => void;
}) {
  const sim = useMujoco();
  const activeRun = useRef(0);
  const startTime = useRef(0);
  const finished = useRef(false);

  useFrame(({ clock }) => {
    if (!sim.isReady || robotKey !== 'franka' || runId === 0) return;
    if (activeRun.current !== runId) {
      activeRun.current = runId;
      startTime.current = clock.elapsedTime;
      finished.current = false;
    }

    const elapsed = clock.elapsedTime - startTime.current;
    const duration = 8.5;
    const keyframes = [
      { at: 0.0, q: [1.707, -1.754, 0.003, -2.702, 0.003, 0.951, 2.49], gripper: 255 },
      { at: 0.22, q: [1.18, -1.48, 0.02, -2.32, 0.04, 1.18, 1.95], gripper: 255 },
      { at: 0.38, q: [0.78, -1.25, 0.1, -2.08, 0.03, 1.18, 1.55], gripper: 0 },
      { at: 0.58, q: [0.5, -1.62, 0.1, -2.58, 0.03, 1.36, 1.25], gripper: 0 },
      { at: 0.78, q: [-0.36, -1.45, -0.18, -2.3, -0.02, 1.18, 0.65], gripper: 0 },
      { at: 0.92, q: [-0.52, -1.25, -0.18, -2.05, -0.02, 1.1, 0.55], gripper: 255 },
      { at: 1.0, q: [1.707, -1.754, 0.003, -2.702, 0.003, 0.951, 2.49], gripper: 255 },
    ];
    const phase = Math.min(1, elapsed / duration);
    let left = keyframes[0];
    let right = keyframes[keyframes.length - 1];
    for (let i = 0; i < keyframes.length - 1; i += 1) {
      if (phase >= keyframes[i].at && phase <= keyframes[i + 1].at) {
        left = keyframes[i];
        right = keyframes[i + 1];
        break;
      }
    }
    const span = Math.max(0.001, right.at - left.at);
    const local = Math.max(0, Math.min(1, (phase - left.at) / span));
    const eased = local * local * (3 - 2 * local);
    const q = left.q.map((v, index) => v + (right.q[index] - v) * eased);
    const gripper = left.gripper + (right.gripper - left.gripper) * eased;
    sim.api.setCtrl({
      actuator1: q[0],
      actuator2: q[1],
      actuator3: q[2],
      actuator4: q[3],
      actuator5: q[4],
      actuator6: q[5],
      actuator7: q[6],
      gripper,
    });

    if (phase >= 1 && !finished.current) {
      finished.current = true;
      onDone();
    }
  });

  return null;
}

function MujocoArmPanel() {
  const apiRef = useRef<MujocoSimAPI>(null);
  const [robotKey, setRobotKey] = useState<RobotKey>('franka');
  const [paused, setPaused] = useState(false);
  const [gravityCompensation, setGravityCompensation] = useState(false);
  const [showGizmo, setShowGizmo] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [demoRunId, setDemoRunId] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);

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
          <button
            className={demoRunning ? 'active' : ''}
            onClick={() => {
              setRobotKey('franka');
              setPaused(false);
              setDemoRunning(true);
              setDemoRunId((value) => value + 1);
            }}
          >
            {demoRunning ? '演示中' : '抓放演示'}
          </button>
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
            <FrankaPickPlaceDemo runId={demoRunId} robotKey={robotKey} onDone={() => setDemoRunning(false)} />
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
  return (
    <main className="app-shell">
      <iframe className="ocean-scene" src={oceanUrl} title="云洲无人艇海洋环境" />
      <div className="top-note">
        <strong>云洲无人艇海洋作业演示</strong>
        <span>高细节海洋场景 + MuJoCo 真实机械臂仿真</span>
      </div>
      <MujocoArmPanel />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
