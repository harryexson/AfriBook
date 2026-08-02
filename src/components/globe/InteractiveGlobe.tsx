'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Billboard } from '@react-three/drei'
import * as THREE from 'three'

// ─── Types ────────────────────────────────────────────────────

interface CountryMarker {
  code: string
  name: string
  lat: number
  lng: number
  flag: string
}

interface InteractiveGlobeProps {
  onCountrySelect?: (countryCode: string) => void
  selectedCountry?: string | null
  focusedCountry?: string | null
  className?: string
}

// ─── Country Data ─────────────────────────────────────────────

const COUNTRIES: CountryMarker[] = [
  { code: 'US', name: 'United States', lat: 37.09, lng: -95.71, flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', lat: 56.13, lng: -106.35, flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', lat: 55.38, lng: -3.44, flag: '🇬🇧' },
  { code: 'IN', name: 'India', lat: 20.59, lng: 78.96, flag: '🇮🇳' },
  { code: 'NG', name: 'Nigeria', lat: 9.08, lng: 8.68, flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', lat: -0.02, lng: 37.91, flag: '🇰🇪' },
  { code: 'MW', name: 'Malawi', lat: -13.25, lng: 34.3, flag: '🇲🇼' },
  { code: 'ZA', name: 'South Africa', lat: -30.56, lng: 22.94, flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', lat: 26.82, lng: 30.8, flag: '🇪🇬' },
  { code: 'AE', name: 'UAE', lat: 23.42, lng: 53.85, flag: '🇦🇪' },
  { code: 'GH', name: 'Ghana', lat: 7.95, lng: -1.02, flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', lat: -6.37, lng: 34.89, flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', lat: 1.37, lng: 32.29, flag: '🇺🇬' },
  { code: 'FR', name: 'France', lat: 46.6, lng: 1.88, flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', lat: 51.17, lng: 10.45, flag: '🇩🇪' },
]

const GLOBE_RADIUS = 2.5

// ─── Coordinate Conversion ────────────────────────────────────

function latLngToPosition(
  lat: number,
  lng: number,
  radius: number
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return [x, y, z]
}

// ─── Earth Shader Material ────────────────────────────────────

function EarthMaterial() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLightDirection: { value: new THREE.Vector3(1, 0.5, 1).normalize() },
      uOceanColor: { value: new THREE.Color('#0d1117') },
      uLandColor: { value: new THREE.Color('#1d242c') },
      uBorderColor: { value: new THREE.Color('#f59e0b') },
    }),
    []
  )

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={`
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform float uTime;
        uniform vec3 uLightDirection;
        uniform vec3 uOceanColor;
        uniform vec3 uLandColor;
        uniform vec3 uBorderColor;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        // Simplex-ish noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = p * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        // Generate procedural landmasses
        float landMask(vec2 uv) {
          // Scale and offset to create continents
          vec2 p = uv * 6.0;
          float n = fbm(p);
          float n2 = fbm(p * 2.0 + vec2(5.0, 3.0));

          // Create continent-like shapes
          float continent = smoothstep(0.45, 0.55, n);
          // Add detail
          float detail = smoothstep(0.3, 0.7, n2);

          // Merge continents with detail
          float land = max(continent * 0.8, detail * 0.3);

          // Add some islands
          float islands = smoothstep(0.7, 0.72, noise(p * 3.0));
          land = max(land, islands * 0.5);

          return clamp(land, 0.0, 1.0);
        }

        // Grid lines for borders
        float gridLines(vec2 uv) {
          float scale = 20.0;
          vec2 grid = fract(uv * scale);
          float line = smoothstep(0.0, 0.03, grid.x) * smoothstep(0.0, 0.03, grid.y);
          line = 1.0 - line;
          return line * 0.15;
        }

        void main() {
          // Lighting
          float diff = max(dot(vNormal, uLightDirection), 0.0);
          float ambient = 0.15;
          float light = ambient + diff * 0.85;

          // Fresnel for atmospheric edge glow
          vec3 viewDir = normalize(-vPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

          // Land vs ocean
          float land = landMask(vUv);

          // Base color: ocean or land
          vec3 baseColor = mix(uOceanColor, uLandColor, land);

          // Add grid lines on land
          float borders = gridLines(vUv) * land;
          baseColor = mix(baseColor, uBorderColor, borders);

          // Apply lighting
          vec3 color = baseColor * light;

          // Add subtle atmospheric glow
          vec3 atmosphereColor = vec3(0.96, 0.62, 0.04);
          color += atmosphereColor * fresnel * 0.4;

          // Subtle pulsing glow on land
          float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
          color += uLandColor * land * pulse * 0.05;

          gl_FragColor = vec4(color, 1.0);
        }
      `}
    />
  )
}

// ─── Atmosphere Glow ──────────────────────────────────────────

function Atmosphere() {
  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        transparent
        side={THREE.BackSide}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          varying vec3 vPosition;

          void main() {
            vec3 viewDir = normalize(-vPosition);
            float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 4.0);
            vec3 color = vec3(0.96, 0.62, 0.04);
            float alpha = fresnel * 0.5;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  )
}

// ─── Country Marker Component ─────────────────────────────────

function CountryMarkerMesh({
  country,
  isSelected,
  isFocused,
  onHover,
  onUnhover,
  onClick,
}: {
  country: CountryMarker
  isSelected: boolean
  isFocused: boolean
  onHover: () => void
  onUnhover: () => void
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const position = useMemo(
    () => latLngToPosition(country.lat, country.lng, GLOBE_RADIUS + 0.02),
    [country.lat, country.lng]
  )

  const baseScale = isSelected || isFocused ? 0.08 : 0.04
  const targetScale = hovered ? 0.1 : baseScale

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()

    // Smooth scale interpolation
    const currentScale = meshRef.current.scale.x
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
    meshRef.current.scale.setScalar(newScale)

    // Pulse animation for glow ring
    if (glowRef.current) {
      const pulse = Math.sin(t * 2 + country.lat * 0.1) * 0.5 + 0.5
      glowRef.current.scale.setScalar(1 + pulse * 0.3)
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.2 + pulse * 0.3
    }
  })

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'
      onHover()
    },
    [onHover]
  )

  const handlePointerOut = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      setHovered(false)
      document.body.style.cursor = 'auto'
      onUnhover()
    },
    [onUnhover]
  )

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      onClick()
    },
    [onClick]
  )

  const color = isSelected || isFocused ? '#f59e0b' : '#fbbf24'

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Core dot */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Tooltip */}
      {(hovered || isFocused) && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Html center distanceFactor={8} zIndexRange={[100, 0]}>
            <div
              style={{
                background: 'rgba(14, 12, 18, 0.92)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'white',
                fontSize: '12px',
                fontFamily: 'Manrope, system-ui, sans-serif',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                transform: 'translateY(-20px)',
              }}
            >
              <span style={{ marginRight: '6px' }}>{country.flag}</span>
              <span style={{ fontWeight: 600 }}>{country.name}</span>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  )
}

// ─── Auto-Rotate Globe ────────────────────────────────────────

function RotatingGlobe({
  children,
}: {
  children: React.ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)
  const isDragging = useRef(false)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    if (isDragging.current) return

    const t = clock.getElapsedTime()
    // Slow auto-rotation
    groupRef.current.rotation.y = t * 0.05
  })

  return <group ref={groupRef}>{children}</group>
}

// ─── Camera Controller ────────────────────────────────────────

function CameraController({
  focusedCountry,
  selectedCountry,
}: {
  focusedCountry?: string | null
  selectedCountry?: string | null
}) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 0, 8))

  useFrame(() => {
    const focusCode = selectedCountry || focusedCountry
    if (focusCode) {
      const country = COUNTRIES.find((c) => c.code === focusCode)
      if (country) {
        const pos = latLngToPosition(country.lat, country.lng, GLOBE_RADIUS + 2)
        targetPos.current.set(pos[0] * 1.3, pos[1] * 1.3, pos[2] * 1.3)
      }
    } else {
      targetPos.current.set(0, 0, 8)
    }

    camera.position.lerp(targetPos.current, 0.02)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─── Scene Content ────────────────────────────────────────────

function Scene({
  onCountrySelect,
  selectedCountry,
  focusedCountry,
}: Omit<InteractiveGlobeProps, 'className'>) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.25} color="#f59e0b" />

      {/* Stars background */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Camera controller */}
      <CameraController
        focusedCountry={focusedCountry}
        selectedCountry={selectedCountry}
      />

      {/* Globe */}
      <RotatingGlobe>
        {/* Earth sphere */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 128, 128]} />
          <EarthMaterial />
        </mesh>

        {/* Atmosphere glow */}
        <Atmosphere />

        {/* Country markers */}
        {COUNTRIES.map((country) => (
          <CountryMarkerMesh
            key={country.code}
            country={country}
            isSelected={selectedCountry === country.code}
            isFocused={focusedCountry === country.code}
            onHover={() => {}}
            onUnhover={() => {}}
            onClick={() => onCountrySelect?.(country.code)}
          />
        ))}
      </RotatingGlobe>

      {/* Orbit controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        autoRotate={false}
      />
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function InteractiveGlobe({
  onCountrySelect,
  selectedCountry,
  focusedCountry,
  className,
}: InteractiveGlobeProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Scene
          onCountrySelect={onCountrySelect}
          selectedCountry={selectedCountry}
          focusedCountry={focusedCountry}
        />
      </Canvas>
    </div>
  )
}
