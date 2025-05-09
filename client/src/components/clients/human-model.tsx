import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HumanModelProps {
  measurements: any;
  title?: string;
  height?: number;
}

export default function HumanModel({ measurements, title = "Vücut Modeli", height = 400 }: HumanModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const humanModelRef = useRef<THREE.Group | null>(null);
  
  // Danışan verilerini analiz et
  const getLatestMeasurements = () => {
    if (!measurements || measurements.length === 0) {
      return {
        weight: 70,
        height: 170,
        bodyFatPercentage: 20,
        waistCircumference: 80,
        hipCircumference: 90,
        chestCircumference: 90,
        armCircumference: 30,
        thighCircumference: 55,
        calfCircumference: 35,
      };
    }
    
    // En son ölçümü al
    const sorted = [...measurements].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return {
      weight: parseFloat(sorted[0].weight) || 70,
      height: parseFloat(sorted[0].height) || 170,
      bodyFatPercentage: parseFloat(sorted[0].bodyFatPercentage) || 20,
      waistCircumference: parseFloat(sorted[0].waistCircumference) || 80,
      hipCircumference: parseFloat(sorted[0].hipCircumference) || 90,
      chestCircumference: parseFloat(sorted[0].chestCircumference) || 90,
      armCircumference: parseFloat(sorted[0].armCircumference) || 30,
      thighCircumference: parseFloat(sorted[0].thighCircumference) || 55,
      calfCircumference: parseFloat(sorted[0].calfCircumference) || 35,
    };
  };
  
  // 3D sahneyi kur
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Three.js sahnesini oluştur
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf5f5f5);
    
    // Kamerayı oluştur
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    cameraRef.current = camera;
    camera.position.z = 5;
    camera.position.y = 1;
    
    // Renderer oluştur
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    
    // Container'a renderer ekle
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    
    // Işıklandırma ekle
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Referans zemini ekle
    const gridHelper = new THREE.GridHelper(10, 10, 0xaaaaaa, 0xaaaaaa);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);
    
    // İnsan modeli oluştur
    createHumanModel();
    
    // Fare ile etkileşimli döndürme değişkenleri
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let autoRotate = true;
    const rotationSpeed = 0.01;
    
    // Fare olayları
    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };
    
    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging || !humanModelRef.current) return;
      
      const deltaX = event.clientX - previousMousePosition.x;
      
      humanModelRef.current.rotation.y += deltaX * rotationSpeed;
      
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };
    
    const onMouseUp = () => {
      isDragging = false;
    };
    
    // Fare olaylarını ekle
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    // Dokunmatik olaylar (mobil için)
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      }
    };
    
    const onTouchMove = (event: TouchEvent) => {
      if (!isDragging || !humanModelRef.current || event.touches.length !== 1) return;
      
      const deltaX = event.touches[0].clientX - previousMousePosition.x;
      
      humanModelRef.current.rotation.y += deltaX * rotationSpeed;
      
      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
      };
    };
    
    const onTouchEnd = () => {
      isDragging = false;
    };
    
    // Dokunmatik olayları ekle
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    
    // Animasyonu başlat
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (humanModelRef.current && autoRotate) {
        // Otomatik döndür
        humanModelRef.current.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Pencere boyutu değişince güncelle
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Olay dinleyicilerini temizle
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      
      // Renderer'ı temizle
      rendererRef.current?.dispose();
    };
  }, []);
  
  // Ölçümleri değiştirince insan modelini güncelle
  useEffect(() => {
    if (sceneRef.current && humanModelRef.current) {
      // Önceki modeli kaldır
      sceneRef.current.remove(humanModelRef.current);
      
      // Yeni model oluştur
      createHumanModel();
    }
  }, [measurements]);
  
  // İnsan modeli oluştur
  const createHumanModel = () => {
    if (!sceneRef.current) return;
    
    const latestMeasurements = getLatestMeasurements();
    
    // Model ölçeklemesi için değerler
    // Vücut yağ yüzdesi arttıkça model şişmanlar
    const fatScale = latestMeasurements.bodyFatPercentage / 25; // 25% yağ oranı referans
    const heightScale = latestMeasurements.height / 170; // 170 cm referans boy
    
    // İnsan modeli grubu
    const humanGroup = new THREE.Group();
    humanModelRef.current = humanGroup;
    
    // Malzemeler
    const skinMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffd0b0,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const fatMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffe0c0, 
      transparent: true,
      opacity: 0.8,
      roughness: 0.9
    });
    
    // Kafa
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 32, 32),
      skinMaterial
    );
    head.position.y = 1.5 * heightScale;
    humanGroup.add(head);
    
    // Gövde (torso)
    const waistScale = latestMeasurements.waistCircumference / 80; // 80 cm referans
    const chestScale = latestMeasurements.chestCircumference / 90; // 90 cm referans
    
    // Gövde ana model
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.3 * chestScale, 
        0.25 * waistScale, 
        0.8 * heightScale, 
        32
      ),
      skinMaterial
    );
    torso.position.y = 0.8 * heightScale;
    humanGroup.add(torso);
    
    // Vücut yağı katmanı
    if (fatScale > 0.7) {
      const fatLayer = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.3 * chestScale * fatScale, 
          0.25 * waistScale * fatScale, 
          0.8 * heightScale, 
          32
        ),
        fatMaterial
      );
      fatLayer.position.y = 0.8 * heightScale;
      humanGroup.add(fatLayer);
    }
    
    // Kalça
    const hipScale = latestMeasurements.hipCircumference / 90; // 90 cm referans
    const hip = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.28 * hipScale * (1 + (fatScale - 1) * 0.5), 
        0.26 * hipScale, 
        0.25 * heightScale, 
        32
      ),
      skinMaterial
    );
    hip.position.y = 0.35 * heightScale;
    humanGroup.add(hip);
    
    // Bacaklar
    const thighScale = latestMeasurements.thighCircumference / 55; // 55 cm referans
    const calfScale = latestMeasurements.calfCircumference / 35; // 35 cm referans
    
    // Sol bacak
    const leftLeg = new THREE.Group();
    
    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.12 * thighScale * (1 + (fatScale - 1) * 0.3), 
        0.09 * (thighScale + calfScale) / 2, 
        0.45 * heightScale, 
        32
      ),
      skinMaterial
    );
    leftThigh.position.y = -0.225 * heightScale;
    leftLeg.add(leftThigh);
    
    const leftCalf = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.09 * (thighScale + calfScale) / 2, 
        0.06 * calfScale, 
        0.45 * heightScale, 
        32
      ),
      skinMaterial
    );
    leftCalf.position.y = -0.675 * heightScale;
    leftLeg.add(leftCalf);
    
    leftLeg.position.set(-0.15, 0.1, 0);
    humanGroup.add(leftLeg);
    
    // Sağ bacak
    const rightLeg = new THREE.Group();
    
    const rightThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.12 * thighScale * (1 + (fatScale - 1) * 0.3), 
        0.09 * (thighScale + calfScale) / 2, 
        0.45 * heightScale, 
        32
      ),
      skinMaterial
    );
    rightThigh.position.y = -0.225 * heightScale;
    rightLeg.add(rightThigh);
    
    const rightCalf = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.09 * (thighScale + calfScale) / 2, 
        0.06 * calfScale, 
        0.45 * heightScale, 
        32
      ),
      skinMaterial
    );
    rightCalf.position.y = -0.675 * heightScale;
    rightLeg.add(rightCalf);
    
    rightLeg.position.set(0.15, 0.1, 0);
    humanGroup.add(rightLeg);
    
    // Kollar
    const armScale = latestMeasurements.armCircumference / 30; // 30 cm referans
    
    // Sol kol
    const leftArm = new THREE.Group();
    
    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.08 * armScale * (1 + (fatScale - 1) * 0.5), 
        0.06 * armScale, 
        0.35 * heightScale, 
        32
      ),
      skinMaterial
    );
    leftUpperArm.position.y = -0.175 * heightScale;
    leftArm.add(leftUpperArm);
    
    const leftLowerArm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.06 * armScale, 
        0.05 * armScale, 
        0.35 * heightScale, 
        32
      ),
      skinMaterial
    );
    leftLowerArm.position.y = -0.525 * heightScale;
    leftArm.add(leftLowerArm);
    
    leftArm.position.set(-0.4, 0.9 * heightScale, 0);
    leftArm.rotation.z = -0.2;
    humanGroup.add(leftArm);
    
    // Sağ kol
    const rightArm = new THREE.Group();
    
    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.08 * armScale * (1 + (fatScale - 1) * 0.5), 
        0.06 * armScale, 
        0.35 * heightScale, 
        32
      ),
      skinMaterial
    );
    rightUpperArm.position.y = -0.175 * heightScale;
    rightArm.add(rightUpperArm);
    
    const rightLowerArm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.06 * armScale, 
        0.05 * armScale, 
        0.35 * heightScale, 
        32
      ),
      skinMaterial
    );
    rightLowerArm.position.y = -0.525 * heightScale;
    rightArm.add(rightLowerArm);
    
    rightArm.position.set(0.4, 0.9 * heightScale, 0);
    rightArm.rotation.z = 0.2;
    humanGroup.add(rightArm);
    
    // Modeli sahneye ekle
    sceneRef.current.add(humanGroup);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Danışanın 3D vücut yapısı modeli</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef} 
          style={{ 
            height: `${height}px`, 
            width: '100%', 
            position: 'relative',
            borderRadius: '0.5rem',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '1rem', 
              left: '1rem', 
              backgroundColor: 'rgba(255,255,255,0.7)', 
              padding: '0.5rem', 
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              color: '#333'
            }}
          >
            Döndürmek için fare ile sürükleyin
          </div>
        </div>
      </CardContent>
    </Card>
  );
}