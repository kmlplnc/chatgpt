import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, calculateBMI } from "@/lib/utils";

interface EnhancedHumanModelProps {
  measurements: any;
  title?: string;
  height?: number;
  gender?: "male" | "female"; // Cinsiyet bilgisi ekledik
}

export default function EnhancedHumanModel({ 
  measurements, 
  title = "Vücut Modeli", 
  height = 400,
  gender = "male" // Varsayılan olarak erkek modeli
}: EnhancedHumanModelProps) {
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
  
  // Varsayılan ölçümleri döndür
  const getDefaultMeasurements = () => {
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
      bmi: calculateBMI(70, 170).toString()
    };
  };

  // Son ölçümleri al
  const getLatestMeasurements = () => {
    if (!measurements || measurements.length === 0) {
      return getDefaultMeasurements();
    }
    
    try {
      // En son ölçümü al
      const sorted = [...measurements].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      if (!sorted || sorted.length === 0) {
        return getDefaultMeasurements();
      }
      
      const weight = parseFloat(sorted[0].weight) || 70;
      const height = parseFloat(sorted[0].height) || 170;
      
      return {
        weight: weight,
        height: height,
        bodyFatPercentage: parseFloat(sorted[0].bodyFatPercentage) || 20,
        waistCircumference: parseFloat(sorted[0].waistCircumference) || 80,
        hipCircumference: parseFloat(sorted[0].hipCircumference) || 90,
        chestCircumference: parseFloat(sorted[0].chestCircumference) || 90,
        armCircumference: parseFloat(sorted[0].armCircumference) || 30,
        thighCircumference: parseFloat(sorted[0].thighCircumference) || 55,
        calfCircumference: parseFloat(sorted[0].calfCircumference) || 35,
        date: sorted[0].date,
        bmi: sorted[0].bmi ? parseFloat(sorted[0].bmi).toString() : calculateBMI(weight, height).toString()
      };
    } catch (error) {
      console.error("Ölçüm verileri alınırken hata oluştu:", error);
      return getDefaultMeasurements();
    }
  };
  
  // Önceki ölçümü al
  const getPreviousMeasurements = () => {
    // En az 2 ölçüm yoksa son ölçümü döndür
    if (!measurements || measurements.length < 2) {
      return getLatestMeasurements();
    }
    
    try {
      const sorted = [...measurements].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      if (!sorted || sorted.length < 2) {
        return getLatestMeasurements();
      }
      
      const weight = parseFloat(sorted[1].weight) || 70;
      const height = parseFloat(sorted[1].height) || 170;
      
      return {
        weight: weight,
        height: height,
        bodyFatPercentage: parseFloat(sorted[1].bodyFatPercentage) || 20,
        waistCircumference: parseFloat(sorted[1].waistCircumference) || 80,
        hipCircumference: parseFloat(sorted[1].hipCircumference) || 90,
        chestCircumference: parseFloat(sorted[1].chestCircumference) || 90,
        armCircumference: parseFloat(sorted[1].armCircumference) || 30,
        thighCircumference: parseFloat(sorted[1].thighCircumference) || 55,
        calfCircumference: parseFloat(sorted[1].calfCircumference) || 35,
        date: sorted[1].date,
        bmi: sorted[1].bmi ? parseFloat(sorted[1].bmi).toString() : calculateBMI(weight, height).toString()
      };
    } catch (error) {
      console.error("Önceki ölçüm verileri alınırken hata oluştu:", error);
      return getLatestMeasurements();
    }
  };
  
  // Manuel olarak daha gelişmiş insan modeli oluştur
  const createCustomModel = (isMaleModel: boolean): THREE.Group => {
    // Ana grup
    const modelGroup = new THREE.Group();
    modelGroup.name = isMaleModel ? "Erkek Modeli" : "Kadın Modeli";
    
    // Material (renk sonra değiştirilecek)
    const skinMaterial = new THREE.MeshPhongMaterial({
      color: 0xAFAFAF,
      shininess: 10,
      specular: 0x111111,
      flatShading: false
    });
    
    // KAFA GRUBU
    const headGroup = new THREE.Group();
    headGroup.name = "headGroup";
    headGroup.position.y = isMaleModel ? 1.65 : 1.6;
    
    // Kafa ana kısmı
    const headGeometry = new THREE.SphereGeometry(
      isMaleModel ? 0.18 : 0.17, 
      32, 
      32
    );
    const head = new THREE.Mesh(headGeometry, skinMaterial.clone());
    head.name = "head";
    headGroup.add(head);
    
    // Çene kısmı
    const jawGeometry = new THREE.SphereGeometry(
      isMaleModel ? 0.15 : 0.14,
      32, 
      16, 
      0, 
      Math.PI * 2, 
      Math.PI / 2, 
      Math.PI / 4
    );
    const jaw = new THREE.Mesh(jawGeometry, skinMaterial.clone());
    jaw.position.y = -0.1;
    jaw.position.z = 0.02;
    jaw.name = "jaw";
    headGroup.add(jaw);
    
    // Boyun
    const neckGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.08 : 0.07,
      isMaleModel ? 0.1 : 0.08,
      0.15,
      16
    );
    const neck = new THREE.Mesh(neckGeometry, skinMaterial.clone());
    neck.position.y = -0.18;
    neck.name = "neck";
    headGroup.add(neck);
    
    modelGroup.add(headGroup);
    
    // VÜCUT GRUBU
    const bodyGroup = new THREE.Group();
    bodyGroup.name = "bodyGroup";
    
    // Omuzlar
    const shouldersGeometry = new THREE.BoxGeometry(
      isMaleModel ? 0.6 : 0.55,
      0.12,
      0.2
    );
    shouldersGeometry.translate(0, 1.35, 0);
    const shoulders = new THREE.Mesh(shouldersGeometry, skinMaterial.clone());
    shoulders.name = "shoulders";
    bodyGroup.add(shoulders);
    
    // Göğüs üst kısmı - daha anatomik
    const chestGeometry = new THREE.SphereGeometry(
      isMaleModel ? 0.28 : 0.26,
      32,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    chestGeometry.scale(1, 0.8, 0.6);
    chestGeometry.translate(0, 1.25, 0.05);
    const chest = new THREE.Mesh(chestGeometry, skinMaterial.clone());
    chest.name = "chest";
    bodyGroup.add(chest);
    
    // Cinsiyet bazlı göğüs detayları
    if (!isMaleModel) {
      // Kadın göğsü
      const leftBreastGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const leftBreast = new THREE.Mesh(leftBreastGeometry, skinMaterial.clone());
      leftBreast.position.set(0.1, 1.2, 0.12);
      leftBreast.name = "leftBreast";
      bodyGroup.add(leftBreast);
      
      const rightBreastGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const rightBreast = new THREE.Mesh(rightBreastGeometry, skinMaterial.clone());
      rightBreast.position.set(-0.1, 1.2, 0.12);
      rightBreast.name = "rightBreast";
      bodyGroup.add(rightBreast);
    } else {
      // Erkek göğüs kasları
      const pectoralsGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.05);
      pectoralsGeometry.translate(0, 1.2, 0.12);
      const pectorals = new THREE.Mesh(pectoralsGeometry, skinMaterial.clone());
      pectorals.name = "pectorals";
      bodyGroup.add(pectorals);
    }
    
    // Karın bölgesi
    const abdomenGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.22 : 0.20,
      isMaleModel ? 0.25 : 0.24,
      0.3,
      16
    );
    abdomenGeometry.translate(0, 1.0, 0);
    const abdomen = new THREE.Mesh(abdomenGeometry, skinMaterial.clone());
    abdomen.name = "abdomen";
    bodyGroup.add(abdomen);
    
    // Alt karın (göbek bölgesi)
    const lowerAbdomenGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.25 : 0.24,
      isMaleModel ? 0.28 : 0.32, // Kadında hafif genişleme
      0.25,
      16
    );
    lowerAbdomenGeometry.translate(0, 0.75, 0);
    const lowerAbdomen = new THREE.Mesh(lowerAbdomenGeometry, skinMaterial.clone());
    lowerAbdomen.name = "lowerAbdomen";
    bodyGroup.add(lowerAbdomen);
    
    // Kalça bölgesi
    const hipWidth = isMaleModel ? 0.27 : 0.33; // Kadında daha geniş kalça
    const hipGeometry = new THREE.CylinderGeometry(
      hipWidth,
      hipWidth * 0.95,
      0.2,
      16
    );
    hipGeometry.translate(0, 0.55, 0);
    const hip = new THREE.Mesh(hipGeometry, skinMaterial.clone());
    hip.name = "hip";
    bodyGroup.add(hip);
    
    modelGroup.add(bodyGroup);
    
    // SOL KOL GRUBU (daha anatomik)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.name = "leftArmGroup";
    leftArmGroup.position.set(-(isMaleModel ? 0.34 : 0.3), 1.32, 0);
    leftArmGroup.rotation.z = -0.1;
    
    // Omuz eklemi
    const leftShoulderJointGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const leftShoulderJoint = new THREE.Mesh(leftShoulderJointGeometry, skinMaterial.clone());
    leftShoulderJoint.name = "leftShoulderJoint";
    leftArmGroup.add(leftShoulderJoint);
    
    // Sol üst kol
    const leftUpperArmGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.06 : 0.05, 
      isMaleModel ? 0.05 : 0.045, 
      0.28, 
      16
    );
    leftUpperArmGeometry.translate(0, -0.15, 0);
    const leftUpperArm = new THREE.Mesh(leftUpperArmGeometry, skinMaterial.clone());
    leftUpperArm.name = "leftUpperArm";
    leftUpperArm.rotation.z = -0.1;
    leftArmGroup.add(leftUpperArm);
    
    // Sol dirsek eklemi
    const leftElbowJointGeometry = new THREE.SphereGeometry(0.045, 16, 16);
    const leftElbowJoint = new THREE.Mesh(leftElbowJointGeometry, skinMaterial.clone());
    leftElbowJoint.position.y = -0.3;
    leftElbowJoint.name = "leftElbowJoint";
    leftArmGroup.add(leftElbowJoint);
    
    // Sol alt kol
    const leftLowerArmGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.045 : 0.04, 
      isMaleModel ? 0.04 : 0.035, 
      0.26, 
      16
    );
    leftLowerArmGeometry.translate(0, -0.43, 0);
    const leftLowerArm = new THREE.Mesh(leftLowerArmGeometry, skinMaterial.clone());
    leftLowerArm.name = "leftLowerArm";
    leftLowerArm.rotation.z = -0.1;
    leftArmGroup.add(leftLowerArm);
    
    // Sol el
    const leftHandGeometry = new THREE.SphereGeometry(0.035, 16, 16);
    leftHandGeometry.scale(1, 1.1, 0.8);
    const leftHand = new THREE.Mesh(leftHandGeometry, skinMaterial.clone());
    leftHand.position.y = -0.57;
    leftHand.name = "leftHand";
    leftArmGroup.add(leftHand);
    
    modelGroup.add(leftArmGroup);
    
    // SAĞ KOL GRUBU
    const rightArmGroup = new THREE.Group();
    rightArmGroup.name = "rightArmGroup";
    rightArmGroup.position.set((isMaleModel ? 0.34 : 0.3), 1.32, 0);
    rightArmGroup.rotation.z = 0.1;
    
    // Omuz eklemi
    const rightShoulderJointGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const rightShoulderJoint = new THREE.Mesh(rightShoulderJointGeometry, skinMaterial.clone());
    rightShoulderJoint.name = "rightShoulderJoint";
    rightArmGroup.add(rightShoulderJoint);
    
    // Sağ üst kol
    const rightUpperArmGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.06 : 0.05, 
      isMaleModel ? 0.05 : 0.045, 
      0.28, 
      16
    );
    rightUpperArmGeometry.translate(0, -0.15, 0);
    const rightUpperArm = new THREE.Mesh(rightUpperArmGeometry, skinMaterial.clone());
    rightUpperArm.name = "rightUpperArm";
    rightUpperArm.rotation.z = 0.1;
    rightArmGroup.add(rightUpperArm);
    
    // Sağ dirsek eklemi
    const rightElbowJointGeometry = new THREE.SphereGeometry(0.045, 16, 16);
    const rightElbowJoint = new THREE.Mesh(rightElbowJointGeometry, skinMaterial.clone());
    rightElbowJoint.position.y = -0.3;
    rightElbowJoint.name = "rightElbowJoint";
    rightArmGroup.add(rightElbowJoint);
    
    // Sağ alt kol
    const rightLowerArmGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.045 : 0.04, 
      isMaleModel ? 0.04 : 0.035, 
      0.26, 
      16
    );
    rightLowerArmGeometry.translate(0, -0.43, 0);
    const rightLowerArm = new THREE.Mesh(rightLowerArmGeometry, skinMaterial.clone());
    rightLowerArm.name = "rightLowerArm";
    rightLowerArm.rotation.z = 0.1;
    rightArmGroup.add(rightLowerArm);
    
    // Sağ el
    const rightHandGeometry = new THREE.SphereGeometry(0.035, 16, 16);
    rightHandGeometry.scale(1, 1.1, 0.8);
    const rightHand = new THREE.Mesh(rightHandGeometry, skinMaterial.clone());
    rightHand.position.y = -0.57;
    rightHand.name = "rightHand";
    rightArmGroup.add(rightHand);
    
    modelGroup.add(rightArmGroup);
    
    // SOL BACAK GRUBU
    const leftLegGroup = new THREE.Group();
    leftLegGroup.name = "leftLegGroup";
    leftLegGroup.position.set(-(isMaleModel ? 0.12 : 0.14), 0.45, 0);
    
    // Kalça eklemi
    const leftHipJointGeometry = new THREE.SphereGeometry(0.07, 16, 16);
    const leftHipJoint = new THREE.Mesh(leftHipJointGeometry, skinMaterial.clone());
    leftHipJoint.name = "leftHipJoint";
    leftLegGroup.add(leftHipJoint);
    
    // Sol üst bacak
    const leftThighGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.11 : 0.12, 
      isMaleModel ? 0.08 : 0.09, 
      0.4, 
      16
    );
    leftThighGeometry.translate(0, -0.23, 0);
    const leftThigh = new THREE.Mesh(leftThighGeometry, skinMaterial.clone());
    leftThigh.name = "leftThigh";
    leftThigh.rotation.z = -0.05;
    leftLegGroup.add(leftThigh);
    
    // Sol diz eklemi
    const leftKneeJointGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const leftKneeJoint = new THREE.Mesh(leftKneeJointGeometry, skinMaterial.clone());
    leftKneeJoint.position.y = -0.45;
    leftKneeJoint.name = "leftKneeJoint";
    leftLegGroup.add(leftKneeJoint);
    
    // Sol baldır
    const leftCalfGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.08 : 0.09, 
      isMaleModel ? 0.05 : 0.055, 
      0.4, 
      16
    );
    leftCalfGeometry.translate(0, -0.68, 0);
    const leftCalf = new THREE.Mesh(leftCalfGeometry, skinMaterial.clone());
    leftCalf.name = "leftCalf";
    leftCalf.rotation.z = 0.05;
    leftLegGroup.add(leftCalf);
    
    // Sol ayak
    const leftFootGeometry = new THREE.BoxGeometry(0.07, 0.05, 0.15);
    leftFootGeometry.translate(0, -0.9, 0.04);
    const leftFoot = new THREE.Mesh(leftFootGeometry, skinMaterial.clone());
    leftFoot.name = "leftFoot";
    leftLegGroup.add(leftFoot);
    
    modelGroup.add(leftLegGroup);
    
    // SAĞ BACAK GRUBU
    const rightLegGroup = new THREE.Group();
    rightLegGroup.name = "rightLegGroup";
    rightLegGroup.position.set((isMaleModel ? 0.12 : 0.14), 0.45, 0);
    
    // Kalça eklemi
    const rightHipJointGeometry = new THREE.SphereGeometry(0.07, 16, 16);
    const rightHipJoint = new THREE.Mesh(rightHipJointGeometry, skinMaterial.clone());
    rightHipJoint.name = "rightHipJoint";
    rightLegGroup.add(rightHipJoint);
    
    // Sağ üst bacak
    const rightThighGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.11 : 0.12, 
      isMaleModel ? 0.08 : 0.09, 
      0.4, 
      16
    );
    rightThighGeometry.translate(0, -0.23, 0);
    const rightThigh = new THREE.Mesh(rightThighGeometry, skinMaterial.clone());
    rightThigh.name = "rightThigh";
    rightThigh.rotation.z = 0.05;
    rightLegGroup.add(rightThigh);
    
    // Sağ diz eklemi
    const rightKneeJointGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const rightKneeJoint = new THREE.Mesh(rightKneeJointGeometry, skinMaterial.clone());
    rightKneeJoint.position.y = -0.45;
    rightKneeJoint.name = "rightKneeJoint";
    rightLegGroup.add(rightKneeJoint);
    
    // Sağ baldır
    const rightCalfGeometry = new THREE.CylinderGeometry(
      isMaleModel ? 0.08 : 0.09, 
      isMaleModel ? 0.05 : 0.055, 
      0.4, 
      16
    );
    rightCalfGeometry.translate(0, -0.68, 0);
    const rightCalf = new THREE.Mesh(rightCalfGeometry, skinMaterial.clone());
    rightCalf.name = "rightCalf";
    rightCalf.rotation.z = -0.05;
    rightLegGroup.add(rightCalf);
    
    // Sağ ayak
    const rightFootGeometry = new THREE.BoxGeometry(0.07, 0.05, 0.15);
    rightFootGeometry.translate(0, -0.9, 0.04);
    const rightFoot = new THREE.Mesh(rightFootGeometry, skinMaterial.clone());
    rightFoot.name = "rightFoot";
    rightLegGroup.add(rightFoot);
    
    modelGroup.add(rightLegGroup);
    
    // Modeli ölçeklendir ve pozisyonla
    modelGroup.scale.set(1.3, 1.3, 1.3);
    modelGroup.position.set(0, -0.75, 0);
    modelGroup.rotation.x = 0.1; // Hafif öne eğim
    
    return modelGroup;
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
    createHumanModels();
    
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
      if (prevHumanModelRef.current && showBothModels) {
        prevHumanModelRef.current.rotation.y += deltaX * rotationSpeed;
      }
      
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
      if (prevHumanModelRef.current && showBothModels) {
        prevHumanModelRef.current.rotation.y += deltaX * rotationSpeed;
      }
      
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
        if (prevHumanModelRef.current && showBothModels) {
          prevHumanModelRef.current.rotation.y += 0.005;
        }
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
  
  // Ölçümleri veya cinsiyet değiştiğinde modeli güncelle
  useEffect(() => {
    if (sceneRef.current) {
      // Modelleri temizle ve yeniden oluştur
      createHumanModels();
    }
  }, [measurements, showBothModels, showDifferences, gender]);
  
  // İnsan modellerini oluştur (güncel ve önceki)
  const createHumanModels = () => {
    if (!sceneRef.current) return;
    
    // Mevcut modelleri temizle
    if (humanModelRef.current) {
      sceneRef.current.remove(humanModelRef.current);
      humanModelRef.current = null;
    }
    if (prevHumanModelRef.current) {
      sceneRef.current.remove(prevHumanModelRef.current);
      prevHumanModelRef.current = null;
    }
    
    const latestMeasurements = getLatestMeasurements();
    const previousMeasurements = getPreviousMeasurements();
    const isMale = gender === "male";
    
    // Güncel model
    try {
      // Modeli oluştur
      const modelGroup = createCustomModel(isMale);
      
      // Ölçeklendirme uygula
      updateModelByMeasurements(modelGroup, latestMeasurements, true);
      humanModelRef.current = modelGroup;
      sceneRef.current.add(modelGroup);
      
      // Eğer karşılaştırma modundaysak ve önceki bir ölçüm varsa
      if (showBothModels && hasPreviousMeasurement && previousMeasurements) {
        const prevModelGroup = createCustomModel(isMale);
        
        updateModelByMeasurements(prevModelGroup, previousMeasurements, false);
        prevHumanModelRef.current = prevModelGroup;
        sceneRef.current.add(prevModelGroup);
        
        // Yan yana gösterme - önceki model solda
        prevModelGroup.position.set(-1.5, 0, 0);
        
        // Eğer farklar gösteriliyorsa
        if (showDifferences) {
          // Önceki modeli yarı saydam ve gri yap
          prevModelGroup.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material.clone();
              if (material instanceof THREE.Material) {
                material.transparent = true;
                material.opacity = 0.6;
                material.color.set(0xaaaaaa); // Gri ton
                child.material = material;
              }
            }
          });
          
          // Fark etiketlerini ekle
          addDifferenceLabels(previousMeasurements);
        }
      }
    } catch (error) {
      console.error("Modeller oluşturulurken hata:", error);
    }
  };
  
  // Ölçümlere göre modeli güncelle
  const updateModelByMeasurements = (model: THREE.Group, measurements: any, isLatest: boolean) => {
    // Sağlık durumuna göre renk
    const healthColor = getHealthColor(measurements);
    
    // Modelin tüm parçaları için rengi güncelle
    model.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          // Birden fazla materyal varsa
          child.material.forEach(mat => {
            if (mat.color) mat.color.set(healthColor);
          });
        } else if (child.material) {
          // Tek materyal varsa
          const material = child.material.clone();
          if (material.color) {
            material.color.set(healthColor);
            child.material = material;
          }
        }
      }
    });
    
    // Ölçekleme faktörleri
    const heightScale = measurements.height / 170; // 170 cm referans boy
    const fatScale = measurements.bodyFatPercentage / 25; // 25% yağ oranı referans
    const waistScale = measurements.waistCircumference / 80; // 80 cm referans
    const hipScale = measurements.hipCircumference / 90; // 90 cm referans
    const chestScale = measurements.chestCircumference / 90; // 90 cm referans
    const armScale = measurements.armCircumference / 30; // 30 cm referans
    const thighScale = measurements.thighCircumference / 55; // 55 cm referans
    const calfScale = measurements.calfCircumference / 35; // 35 cm referans
    
    // Vücut parçalarını bul ve ölçeklendir
    model.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        // İsme göre vücut parçasını belirle ve ölçeklendir
        const name = child.name.toLowerCase();
        
        // Genel boy ölçeklendirme
        if (child.position) {
          child.position.y *= heightScale;
        }
        
        // Parçaya özel ölçeklendirme
        if (name.includes("head")) {
          child.scale.set(1, 1, 1);
        } 
        else if (name.includes("torso")) {
          child.scale.set(
            1 + (fatScale - 1) * 0.7, 
            1, 
            1 + (fatScale - 1) * 0.7
          );
          child.scale.x *= chestScale;
          child.scale.z *= chestScale;
        } 
        else if (name.includes("hip")) {
          child.scale.set(
            1 + (fatScale - 1) * 0.5, 
            1, 
            1 + (fatScale - 1) * 0.5
          );
          child.scale.x *= hipScale;
          child.scale.z *= hipScale;
        } 
        else if (name.includes("arm")) {
          child.scale.set(
            1 + (fatScale - 1) * 0.3, 
            1, 
            1 + (fatScale - 1) * 0.3
          );
          child.scale.x *= armScale;
          child.scale.z *= armScale;
        } 
        else if (name.includes("leg")) {
          // Bacak parçaları
          if (name.includes("upper")) {
            child.scale.set(
              1 + (fatScale - 1) * 0.4, 
              1, 
              1 + (fatScale - 1) * 0.4
            );
            child.scale.x *= thighScale;
            child.scale.z *= thighScale;
          } else if (name.includes("lower")) {
            child.scale.set(
              1 + (fatScale - 1) * 0.2, 
              1, 
              1 + (fatScale - 1) * 0.2
            );
            child.scale.x *= calfScale;
            child.scale.z *= calfScale;
          }
        }
      }
    });
    
    // Modelin genel konumu
    model.position.set(0, 0, 0);
    
    // Eğer güncel model değilse farklı konumlandır
    if (!isLatest) {
      model.position.set(-1.5, 0, 0);
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
          {/* Cinsiyet seçimi */}
          <div className="flex justify-end space-x-2 mb-2">
            <Button 
              size="sm" 
              variant={gender === "male" ? "default" : "outline"} 
              onClick={() => gender !== "male" && createHumanModels()}
            >
              Erkek
            </Button>
            <Button 
              size="sm" 
              variant={gender === "female" ? "default" : "outline"} 
              onClick={() => gender !== "female" && createHumanModels()}
            >
              Kadın
            </Button>
          </div>
          
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Karşılaştırma</h4>
                    <p className="text-xs text-gray-500">
                      {differences.dates.previous} ile {differences.dates.current} arasındaki değişiklikler
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ağırlık:</span>
                      <div className="flex items-center">
                        <span className={differences.weight.improved ? "text-green-600" : "text-red-600"}>
                          {differences.weight.value} kg
                        </span>
                        <span className="ml-1 text-xs">({differences.weight.improved ? '↓' : '↑'} {differences.weight.percentage}%)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vücut Yağı:</span>
                      <div className="flex items-center">
                        <span className={differences.bodyFat.improved ? "text-green-600" : "text-red-600"}>
                          {differences.bodyFat.value}%
                        </span>
                        <span className="ml-1 text-xs">({differences.bodyFat.improved ? '↓' : '↑'})</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">BMI:</span>
                      <div className="flex items-center">
                        <span className={differences.bmi.improved ? "text-green-600" : "text-red-600"}>
                          {differences.bmi.value}
                        </span>
                        <span className="ml-1 text-xs">({differences.bmi.improved ? '↓' : '↑'} {differences.bmi.percentage}%)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bel Çevresi:</span>
                      <div className="flex items-center">
                        <span className={differences.waist.improved ? "text-green-600" : "text-red-600"}>
                          {differences.waist.value} cm
                        </span>
                        <span className="ml-1 text-xs">({differences.waist.improved ? '↓' : '↑'} {differences.waist.percentage}%)</span>
                      </div>
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