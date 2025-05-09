import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, calculateBMI } from "@/lib/utils";

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
  const prevHumanModelRef = useRef<THREE.Group | null>(null);
  
  const [showBothModels, setShowBothModels] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showDifferences, setShowDifferences] = useState(true);
  
  // Danışan verileri
  const hasPreviousMeasurement = measurements && measurements.length >= 2;
  
  // En son 2 ölçümü al
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
        date: new Date().toISOString().split('T')[0],
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
      date: sorted[0].date,
    };
  };
  
  // Önceki ölçümü al
  const getPreviousMeasurements = () => {
    if (!measurements || measurements.length < 2) {
      return getLatestMeasurements();
    }
    
    const sorted = [...measurements].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return {
      weight: parseFloat(sorted[1].weight) || 70,
      height: parseFloat(sorted[1].height) || 170,
      bodyFatPercentage: parseFloat(sorted[1].bodyFatPercentage) || 20,
      waistCircumference: parseFloat(sorted[1].waistCircumference) || 80,
      hipCircumference: parseFloat(sorted[1].hipCircumference) || 90,
      chestCircumference: parseFloat(sorted[1].chestCircumference) || 90,
      armCircumference: parseFloat(sorted[1].armCircumference) || 30,
      thighCircumference: parseFloat(sorted[1].thighCircumference) || 55,
      calfCircumference: parseFloat(sorted[1].calfCircumference) || 35,
      date: sorted[1].date,
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
    if (sceneRef.current) {
      // Önceki modelleri kaldır
      if (humanModelRef.current) {
        sceneRef.current.remove(humanModelRef.current);
      }
      if (prevHumanModelRef.current) {
        sceneRef.current.remove(prevHumanModelRef.current);
      }
      
      // Yeni modelleri oluştur
      createHumanModels();
    }
  }, [measurements, showBothModels, showDifferences]);
  
  // İnsan modellerini oluştur (güncel ve önceki)
  const createHumanModels = () => {
    if (!sceneRef.current) return;
    
    const latestMeasurements = getLatestMeasurements();
    const previousMeasurements = getPreviousMeasurements();
    
    // Modelleri oluştur
    createHumanModel(latestMeasurements, true);
    
    // Karşılaştırma modunu etkinleştirince önceki ölçüme göre de model oluştur
    if (showBothModels && hasPreviousMeasurement) {
      createPreviousHumanModel(previousMeasurements);
    }
  };
  
  // Önceki versiyonu da göster
  const createPreviousHumanModel = (measurements: any) => {
    if (!sceneRef.current) return;
    
    // Önceki modeli oluştur, showDifferences moduna göre renklerini değiştir
    if (showDifferences) {
      // Sağ tarafa mevcut modelin yarı saydamlıkta önceki halini koy
      createHumanModel(measurements, false);
      if (prevHumanModelRef.current) {
        prevHumanModelRef.current.position.set(1.5, 0, 0);
        
        // Önceki modeli saydamlaştır ve rengini değiştir
        prevHumanModelRef.current.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            const material = child.material.clone();
            material.transparent = true;
            material.opacity = 0.6;
            material.color.set(0xaaaaaa); // Gri ton
            child.material = material;
          }
        });
        
        // Fark etiketlerini ekle
        addDifferenceLabels(measurements);
      }
    } else {
      // Normal yan yana gösterme modu
      createHumanModel(measurements, false);
    }
  };
  
  // Fark etiketlerini ekle (değişim oklarını göster)
  const addDifferenceLabels = (previousMeasurements: any) => {
    if (!sceneRef.current || !humanModelRef.current || !prevHumanModelRef.current) return;
    
    const current = getLatestMeasurements();
    const previous = previousMeasurements;
    
    // Ağırlık değişimi
    const weightDiff = current.weight - previous.weight;
    
    // Vücut yağ oranı değişimi
    const bodyFatDiff = current.bodyFatPercentage - previous.bodyFatPercentage;
    
    // BMI değişimi
    const currentBMI = current.bmi ? parseFloat(current.bmi) : calculateBMI(current.weight, current.height);
    const previousBMI = previous.bmi ? parseFloat(previous.bmi) : calculateBMI(previous.weight, previous.height);
    const bmiDiff = currentBMI - previousBMI;
    
    // Bel çevresi değişimi
    const waistDiff = current.waistCircumference - previous.waistCircumference;
    
    // Değişim metni
    const text = `
    Ağırlık: ${weightDiff.toFixed(1)} kg (${(weightDiff / previous.weight * 100).toFixed(1)}%)
    Vücut Yağı: ${bodyFatDiff.toFixed(1)}% (${bodyFatDiff > 0 ? '+' : ''}${bodyFatDiff.toFixed(1)}%)
    BMI: ${bmiDiff.toFixed(1)} (${(bmiDiff / previousBMI * 100).toFixed(1)}%)
    Bel: ${waistDiff.toFixed(1)} cm (${(waistDiff / previous.waistCircumference * 100).toFixed(1)}%)
    `;
    
    // İleride: 3D ok eklentisi eklenebilir
  };
  
  // Sağlık durumu analizi yap ve uygun renk döndür
  const getHealthColor = (measurements: any) => {
    // Vücut yağ yüzdesi ve BMI'ya göre renk belirleme
    const bmi = measurements.bmi ? parseFloat(measurements.bmi) : calculateBMI(measurements.weight, measurements.height);
    const bodyFat = measurements.bodyFatPercentage;
    
    if (bmi < 18.5) {
      return 0x87CEFA; // Zayıf - açık mavi
    } else if (bmi < 25 && bodyFat < 25) {
      return 0x98FB98; // Sağlıklı - açık yeşil
    } else if (bmi < 30 && bodyFat < 30) {
      return 0xFFD700; // Fazla kilolu - sarı
    } else {
      return 0xFFA07A; // Obez - açık kırmızı
    }
  };
  
  // İnsan modeli oluştur
  const createHumanModel = (measurements: any, isLatest: boolean) => {
    if (!sceneRef.current) return;
    
    // Model ölçeklemesi için değerler
    // Vücut yağ yüzdesi arttıkça model şişmanlar
    const fatScale = measurements.bodyFatPercentage / 25; // 25% yağ oranı referans
    const heightScale = measurements.height / 170; // 170 cm referans boy
    
    // İnsan modeli grubu
    const humanGroup = new THREE.Group();
    
    if (isLatest) {
      humanModelRef.current = humanGroup;
      // Güncel model ortada
      humanGroup.position.set(0, 0, 0);
    } else {
      prevHumanModelRef.current = humanGroup;
      // Önceki model sol tarafta
      humanGroup.position.set(-1.5, 0, 0);
    }
    
    // Sağlığa göre renk belirleme
    const healthColor = getHealthColor(measurements);
    
    // Malzemeler
    const skinMaterial = new THREE.MeshStandardMaterial({ 
      color: healthColor,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const fatMaterial = new THREE.MeshStandardMaterial({ 
      color: healthColor, 
      transparent: true,
      opacity: 0.6,
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
    const waistScale = measurements.waistCircumference / 80; // 80 cm referans
    const chestScale = measurements.chestCircumference / 90; // 90 cm referans
    
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
    const hipScale = measurements.hipCircumference / 90; // 90 cm referans
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
    const thighScale = measurements.thighCircumference / 55; // 55 cm referans
    const calfScale = measurements.calfCircumference / 35; // 35 cm referans
    
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
    const armScale = measurements.armCircumference / 30; // 30 cm referans
    
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
  
  // Son ve önceki ölçüm arasındaki değişimi hesapla
  const calculateDifference = () => {
    if (!hasPreviousMeasurement) return null;
    
    const current = getLatestMeasurements();
    const previous = getPreviousMeasurements();
    
    if (!current || !previous) return null;
    
    // Ağırlık değişimi
    const weightDiff = current.weight - previous.weight;
    const weightPercentage = (weightDiff / previous.weight * 100).toFixed(1);
    
    // Vücut yağ oranı değişimi
    const bodyFatDiff = current.bodyFatPercentage - previous.bodyFatPercentage;
    
    // BMI değişimi
    const currentBMI = current.bmi ? parseFloat(current.bmi) : calculateBMI(current.weight, current.height);
    const previousBMI = previous.bmi ? parseFloat(previous.bmi) : calculateBMI(previous.weight, previous.height);
    const bmiDiff = currentBMI - previousBMI;
    const bmiPercentage = (bmiDiff / previousBMI * 100).toFixed(1);
    
    // Bel çevresi değişimi
    const waistDiff = current.waistCircumference - previous.waistCircumference;
    const waistPercentage = (waistDiff / previous.waistCircumference * 100).toFixed(1);
    
    return {
      weight: {
        value: weightDiff.toFixed(1),
        percentage: weightPercentage,
        improved: weightDiff < 0 // Kilo kaybı iyileşme göstergesidir (çoğu durumda)
      },
      bodyFat: {
        value: bodyFatDiff.toFixed(1),
        improved: bodyFatDiff < 0 // Yağ oranı düşmesi iyileşme göstergesidir
      },
      bmi: {
        value: bmiDiff.toFixed(1),
        percentage: bmiPercentage,
        improved: bmiDiff < 0 // BMI düşmesi genelde iyileşme göstergesidir
      },
      waist: {
        value: waistDiff.toFixed(1),
        percentage: waistPercentage,
        improved: waistDiff < 0 // Bel incelme iyileşme göstergesidir
      },
      dates: {
        current: formatDate(current.date),
        previous: formatDate(previous.date)
      }
    };
  };
  
  // Değişim verileri
  const differences = calculateDifference();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Danışanın 3D vücut yapısı modeli</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Model görüntüleyici */}
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
          
          {/* Sağlık renk kodu açıklamaları */}
          <div className="flex items-center justify-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-sky-300"></div>
              <span>Zayıf</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-200"></div>
              <span>Normal</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
              <span>Fazla Kilolu</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-200"></div>
              <span>Obez</span>
            </div>
          </div>
          
          {hasPreviousMeasurement && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant={showBothModels ? "default" : "outline"} 
                  onClick={() => {
                    setShowBothModels(!showBothModels);
                    createHumanModels();
                  }}
                >
                  {showBothModels ? "Tek Model Göster" : "Karşılaştır"}
                </Button>
                
                {showBothModels && (
                  <Button 
                    size="sm" 
                    variant={showDifferences ? "default" : "outline"} 
                    onClick={() => {
                      setShowDifferences(!showDifferences);
                      createHumanModels();
                    }}
                  >
                    {showDifferences ? "Tüm Farkları Göster" : "Farkları Göster"}
                  </Button>
                )}
              </div>
              
              {differences && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <div className="text-xs text-muted-foreground mb-2">
                    {differences.dates.previous} &rarr; {differences.dates.current}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center ${differences.weight.improved ? 'text-green-600' : 'text-red-500'}`}>
                      <span>Ağırlık: {differences.weight.value} kg</span>
                      <span className="ml-1 text-xs">({differences.weight.improved ? '↓' : '↑'} {differences.weight.percentage}%)</span>
                    </div>
                    <div className={`flex items-center ${differences.bodyFat.improved ? 'text-green-600' : 'text-red-500'}`}>
                      <span>Vücut Yağı: {differences.bodyFat.value}%</span>
                      <span className="ml-1 text-xs">{differences.bodyFat.improved ? '↓ düşüş' : '↑ artış'}</span>
                    </div>
                    <div className={`flex items-center ${differences.bmi.improved ? 'text-green-600' : 'text-red-500'}`}>
                      <span>BMI: {differences.bmi.value}</span>
                      <span className="ml-1 text-xs">({differences.bmi.improved ? '↓' : '↑'} {differences.bmi.percentage}%)</span>
                    </div>
                    <div className={`flex items-center ${differences.waist.improved ? 'text-green-600' : 'text-red-500'}`}>
                      <span>Bel: {differences.waist.value} cm</span>
                      <span className="ml-1 text-xs">({differences.waist.improved ? '↓' : '↑'} {differences.waist.percentage}%)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}