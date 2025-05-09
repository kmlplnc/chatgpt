import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FbxModelViewerProps {
  modelPath: string;
  title?: string;
  height?: number;
}

export default function FbxModelViewer({ 
  modelPath, 
  title = "3D Model",
  height = 400 
}: FbxModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Scene oluştur
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    // Kamera oluştur
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 5);
    
    // Renderer oluştur
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    
    // DOM'a ekle
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    
    // Orbit kontrol ekle (fare ile döndürme)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Işıklandırma
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-1, 0, -1);
    scene.add(backLight);
    
    // Zemin
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // FBX modeli yükle
    console.log(`FBX modeli yükleniyor: ${modelPath}`);
    const loader = new FBXLoader();
    
    loader.load(
      modelPath,
      (fbxModel) => {
        console.log('FBX model başarıyla yüklendi!');
        
        // Modeli ölçeklendir (FBX dosyaları genellikle çok büyük olur)
        fbxModel.scale.set(0.01, 0.01, 0.01);
        
        // Modeli merkeze al
        const box = new THREE.Box3().setFromObject(fbxModel);
        const center = box.getCenter(new THREE.Vector3());
        fbxModel.position.set(-center.x, -center.y, -center.z);
        
        // Boyut ayarla - genelde 2 birim yükseklikte olsun
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        fbxModel.scale.multiplyScalar(scale);
        
        // Daha güzel görünmesi için model ortalamasını 0,0,0'a getir
        fbxModel.position.y = 0;
        
        // Kamera pozisyonunu ayarla
        camera.position.set(0, 1, 5);
        controls.target.set(0, 0, 0);
        controls.update();
        
        // Sahneye ekle
        scene.add(fbxModel);
      },
      (xhr) => {
        // Yükleme durumu
        console.log(`${(xhr.loaded / xhr.total * 100).toFixed(0)}% yüklendi`);
      },
      (error) => {
        // Hata durumu
        console.error('FBX model yüklenirken hata:', error);
        
        // Hata mesajını göster
        const errorText = document.createElement('div');
        errorText.style.position = 'absolute';
        errorText.style.top = '50%';
        errorText.style.left = '50%';
        errorText.style.transform = 'translate(-50%, -50%)';
        errorText.style.color = 'red';
        errorText.style.fontWeight = 'bold';
        errorText.textContent = 'Model yüklenemedi!';
        containerRef.current?.appendChild(errorText);
      }
    );
    
    // Animasyon döngüsü
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    
    // Pencere boyutu değiştiğinde güncelle
    function handleResize() {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    }
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [modelPath]); // modelPath değiştiğinde yeniden yükle

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%', 
            height: `${height}px`,
            position: 'relative'
          }}
        />
      </CardContent>
    </Card>
  );
}