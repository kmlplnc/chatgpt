import React, { useState } from "react";
import { Sun, CheckCircle, AlertTriangle, Info, Leaf, Utensils, Users, Carrot, Egg, Fish, Apple, Nut, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

const vitaminsData = [
  {
    name: "Vitamin A (Retinol / Beta-Karoten)",
    type: "Vitamin",
    description: "Görme, bağışıklık ve hücre yenilenmesi için kritik bir yağda çözünen vitamindir.",
    daily: {
      yetiskin: "Erkek: 900 mcg RAE, Kadın: 700 mcg RAE",
      cocuk: "Çocuklar: 300-600 mcg RAE (yaşa göre)",
      ust_sinir: "3000 mcg/gün (retinol formunda)"
    },
    functions: [
      "Göz sağlığı için gereklidir (özellikle gece görüşü).",
      "Deri, hücre dokularının korunmasında rol alır.",
      "Bağışıklık sistemini destekler.",
      "Antioksidan özellik taşır (özellikle beta-karoten formunda).",
      "Embriyonik gelişim ve üreme sağlığı için önemlidir."
    ],
    deficiency: [
      "Gece körlüğü (ilk belirti)",
      "Göz kuruluğu ve kornea hasarı",
      "Deride kuruluk, pullanma",
      "Enfeksiyonlara yatkınlık",
      "Büyüme geriliği (çocuklarda)"
    ],
    excess: [
      "Genellikle yüksek doz takviye alımında görülür — beta-karoten formu toksik değildir",
      "Baş ağrısı, mide bulantısı",
      "Karaciğer toksisitesi",
      "Deri sararması (karotenemi)",
      "Gebelerde yüksek dozda alımı doğumsal defekt riskini artırabilir"
    ],
    sources: [
      "Karaciğer (en zengin kaynak)",
      "Havuç, tatlı patates, balkabağı (beta-karoten)",
      "Ispanak, pazı, lahana",
      "Yumurta sarısı",
      "Süt ve süt ürünleri"
    ],
    advice: [
      "Renkli sebzelerden günlük tüketim sağlayın (özellikle turuncu ve koyu yeşil sebzeler).",
      "A vitamini yağda çözüldüğü için yağla birlikte alınması emilimi artırır."
    ],
    summary: "Görme, bağışıklık ve hücre yenilenmesi için kritik bir vitamindir.",
    risk: [
      "Yetersiz beslenen bireyler",
      "Yağ emilim bozukluğu olanlar (örn. çölyak, pankreatit)",
      "Alkole bağlı karaciğer hastaları",
      "Vegan beslenen bireyler (retinol formunu almazlar)",
      "Sık enfeksiyon geçiren çocuklar"
    ]
  },
  {
    name: "Vitamin D",
    type: "Vitamin",
    description: "Kemik sağlığı ve bağışıklık için en kritik vitaminlerden biridir. Yağda çözünür ve vücutta depolanabilir.",
    daily: {
      yetiskin: "600 IU (15 mcg)",
      yasli: "800 IU (20 mcg)",
      cocuk: "400 IU (10 mcg)",
      ust_sinir: "Günde 4000 IU'dan fazla alım önerilmez (uzun süreli kullanımda)"
    },
    functions: [
      "Kalsiyum ve fosforun emilimini artırarak kemik mineralizasyonunu destekler.",
      "Diş sağlığını korur.",
      "Bağışıklık sistemini güçlendirerek enfeksiyonlara karşı koruma sağlar.",
      "Kas fonksiyonlarını destekler, kas gücünü artırır.",
      "Hücre büyümesi, bağışıklık cevabı ve inflamasyonun düzenlenmesinde rol alır.",
      "Bazı araştırmalar, depresyon riskini azaltma ve kardiyovasküler sağlığa katkıda bulunabileceğini öne sürer."
    ],
    deficiency: [
      "Çocuklarda: Raşitizm (kemiklerde şekil bozukluğu, bacaklarda eğrilik)",
      "Yetişkinlerde: Osteomalazi (kemiklerde yumuşama) ve Osteoporoz (kemik yoğunluğu azalması)",
      "Kas güçsüzlüğü, kas ve eklem ağrıları",
      "Bağışıklık zayıflığı, sık enfeksiyon geçirme",
      "Yorgunluk, halsizlik",
      "Güneş görmeyen bölgelerde yaşayanlarda depresif ruh hali"
    ],
    excess: [
      "D Vitamini toksisitesi genellikle yüksek doz takviyelerin kontrolsüz kullanımıyla görülür.",
      "Hiperkalsemi (kanda aşırı kalsiyum): bulantı, kusma, bilinç değişiklikleri",
      "Böbrek taşı oluşumu",
      "Böbrek fonksiyonlarında bozulma",
      "Kalp ritminde düzensizlik",
      "İştah kaybı, kilo kaybı"
    ],
    sources: [
      "Güneş ışığı (UVB): En önemli doğal kaynak. Günde 10–30 dakika güneşe çıkmak (eller, yüz ve kollar açık şekilde) yeterli olabilir.",
      "Yağlı balıklar: Somon, sardalya, uskumru",
      "Balık yağı (örneğin morina karaciğeri yağı)",
      "Yumurta sarısı",
      "Karaciğer",
      "D vitamini ile zenginleştirilmiş gıdalar: Süt, yoğurt, bazı kahvaltılık gevrekler"
    ],
    advice: [
      "Haftada 2–3 kez yağlı balık tüketin.",
      "Mümkünse her gün sabah veya öğlen saatlerinde 15–20 dakika güneş ışığına çıkın (cam arkasından değil, doğrudan).",
      "D vitamini eksikliği varsa doktor önerisiyle takviye alınmalı. Kendi başınıza yüksek doz almaktan kaçının."
    ],
    summary: "Kemik sağlığı ve bağışıklık için en kritik vitaminlerden biridir.",
    risk: [
      "Güneş ışığına az maruz kalanlar (kapalı giyinenler, evden çıkmayanlar)",
      "Koyu tenli bireyler (melanin D vitamini üretimini azaltır)",
      "Yaşlılar (ciltte sentez azalır)",
      "Obez bireyler (D vitamini yağ dokuda tutulur, dolaşıma geçmesi azalır)",
      "Emziren anneler ve bebekleri",
      "Emilim bozukluğu olan hastalar (Çölyak, Crohn, kistik fibrozis vb.)",
      "Karaciğer ve böbrek hastalığı olan bireyler (D vitamininin aktif forma dönüşmesi bozulur)"
    ]
  },
  {
    name: "Vitamin E (Tokoferol)",
    type: "Vitamin",
    description: "Güçlü bir antioksidan olan E vitamini, hücre zarlarını serbest radikal hasarına karşı korur. Yağda çözünen bir vitamindir.",
    daily: {
      yetiskin: "15 mg alfa-tokoferol",
      ust_sinir: "1000 mg (takviye formu)"
    },
    functions: [
      "Antioksidan etkisiyle hücreleri oksidatif stresten korur.",
      "Cilt sağlığını destekler, yaşlanmayı geciktirir.",
      "Bağışıklık sisteminin düzgün çalışmasına katkıda bulunur.",
      "Damar sağlığını destekler, pıhtı oluşumunu azaltabilir.",
      "Üreme sağlığı üzerinde olumlu etkileri vardır."
    ],
    deficiency: [
      "Sinir sistemi bozuklukları (denge kaybı, refleks azalması)",
      "Kas zayıflığı",
      "Görme problemleri (retina dejenerasyonu)",
      "Bağışıklık sisteminde zayıflık",
      "Ciltte kuruma, tahriş"
    ],
    excess: [
      "Takviye formunda yüksek dozda uzun süreli kullanım sonucu",
      "Kanama riski artar (özellikle kan sulandırıcılarla birlikte alınırsa)",
      "Mide bulantısı, halsizlik",
      "Karaciğer stresine neden olabilir"
    ],
    sources: [
      "Ayçiçek yağı, zeytinyağı",
      "Badem, fındık, ceviz",
      "Avokado",
      "Ispanak, brokoli",
      "Tam tahıllar"
    ],
    advice: [
      "Günlük olarak 1 avuç çiğ kuruyemiş (özellikle badem, fındık) tüketmek yeterlidir.",
      "Yağda çözünen bir vitamin olduğu için doğal kaynaklarla almak en uygunudur."
    ],
    summary: "Güçlü antioksidan, hücre zarlarını korur.",
    risk: [
      "Yağ emilim bozukluğu olan bireyler (kistik fibrozis, çölyak hastalığı)",
      "Prematüre bebekler",
      "Yetersiz beslenen yaşlı bireyler",
      "Uzun süreli düşük yağlı diyet yapanlar"
    ]
  },
  {
    name: "Vitamin K (K1 - Filloquinon, K2 - Menakinon)",
    type: "Vitamin",
    description: "Kanın pıhtılaşmasını sağlayan, kemik ve damar sağlığında önemli rol oynayan yağda çözünen vitamindir.",
    daily: {
      erkek: "120 mcg",
      kadin: "90 mcg",
      ust_sinir: "Üst sınır belirlenmemiştir (toksisite riski düşüktür)"
    },
    functions: [
      "Kanın pıhtılaşma sürecinde gerekli olan protrombin sentezini sağlar.",
      "Kemik dokusunun güçlenmesinde rol oynar.",
      "Damar kireçlenmesini önleyici etkisi vardır.",
      "K2 formu, kalsiyumun doğru yerlere yönlenmesini sağlar (kemik → damar değil)."
    ],
    deficiency: [
      "Uzayan kanamalar, burun veya diş eti kanamaları",
      "Ciltte kolay morarma",
      "Bebeklerde beyin kanaması riski",
      "Kırılgan kemikler, osteoporoz"
    ],
    excess: [
      "Doğal kaynaklardan alınan K1 ve K2 için toksisite görülmez.",
      "Ancak yüksek doz sentetik K3 (menadion) toksik olabilir (kullanımı yasaklanmıştır)."
    ],
    sources: [
      "Ispanak, lahana, brokoli, marul (K1)",
      "Fermente ürünler: Natto (K2)",
      "Karaciğer",
      "Yumurtanın sarısı",
      "Yoğurt, peynir gibi fermente süt ürünleri (K2)"
    ],
    advice: [
      "Her gün yeşil yapraklı sebzelerden 1–2 porsiyon tüketin.",
      "Probiyotik fermente ürünlerle (örneğin yoğurt) K2 alımını destekleyin."
    ],
    summary: "Kanın pıhtılaşması ve kemik sağlığı için gereklidir.",
    risk: [
      "Yeni doğan bebekler (bağırsaklarında sentezleyemez)",
      "Uzun süre antibiyotik kullananlar (barsak florası bozulur)",
      "Karaciğer hastalığı olanlar",
      "Yağ emilim bozukluğu yaşayanlar"
    ]
  },
  {
    name: "Vitamin C (Askorbik Asit)",
    type: "Vitamin",
    description: "Suda çözünen güçlü bir antioksidandır. Bağışıklık, doku onarımı ve demir emilimi için gereklidir.",
    daily: {
      erkek: "90 mg",
      kadin: "75 mg",
      sigara: "+35 mg (sigara içenlerde)",
      ust_sinir: "2000 mg/gün"
    },
    functions: [
      "Bağışıklık sistemini güçlendirir.",
      "Kollajen sentezi için gereklidir (cilt, bağ dokusu, damar sağlığı).",
      "Demir emilimini artırır.",
      "Antioksidan etkisiyle serbest radikallerle savaşır.",
      "Yara iyileşmesini hızlandırır.",
      "Enfeksiyonlara karşı direnç sağlar."
    ],
    deficiency: [
      "Skorbüt hastalığı (diş eti kanaması, diş dökülmesi, halsizlik)",
      "Deri altında kolay morarma",
      "Yaraların geç iyileşmesi",
      "Bağışıklığın zayıflaması",
      "Yorgunluk, kas ağrısı"
    ],
    excess: [
      "Suda çözünen olduğundan fazlası genellikle atılır, ancak aşırı dozda takviye kullanımı:",
      "Mide bulantısı, ishal",
      "Böbrek taşı riski (özellikle oksalat taşı)",
      "Karın ağrısı, gaz"
    ],
    sources: [
      "Kırmızı ve yeşil biber",
      "Portakal, mandalina, greyfurt",
      "Kuşburnu, çilek, kivi",
      "Lahana, brokoli",
      "Maydanoz"
    ],
    advice: [
      "Meyve ve sebzeler çiğ olarak veya çok az pişirilerek tüketilmeli (ısıl işlem C vitaminini yok eder).",
      "Her gün en az 2 porsiyon taze meyve veya sebze tüketilmesi önerilir."
    ],
    summary: "Bağışıklık ve doku onarımı için gereklidir.",
    risk: [
      "Sigara içenler",
      "Düşük sebze-meyve tüketen bireyler",
      "Yaşlılar",
      "Alkole bağımlı bireyler",
      "Emilim bozukluğu yaşayanlar (malabsorbsiyon sendromları)"
    ]
  },
  {
    name: "Vitamin B1 (Tiamin)",
    type: "Vitamin",
    description: "Karbonhidrat metabolizmasında görev alır, sinir sistemi ve kas fonksiyonları için hayati önem taşır.",
    daily: {
      erkek: "1.2 mg",
      kadin: "1.1 mg",
      ekstra: "Artan enerji ihtiyacında (sporcular, gebelik vs.) doz artar"
    },
    functions: [
      "Karbonhidratları enerjiye dönüştürmede görev alır.",
      "Sinir hücrelerinin iletimi için önemlidir.",
      "Kalp fonksiyonlarının düzenli çalışmasını destekler.",
      "Beyin işlevlerine katkı sağlar."
    ],
    deficiency: [
      "Beriberi hastalığı:",
      "Kuru form: Kas zayıflığı, nöropati",
      "Yaş form: Kalp yetmezliği, ödem",
      "Wernicke-Korsakoff sendromu (alkol bağımlılarında)",
      "Yorgunluk, sinirlilik, refleks kaybı",
      "Konsantrasyon güçlüğü"
    ],
    excess: [
      "Tiamin suda çözünen olduğu için fazlası genellikle atılır. Toksik etkisi nadirdir."
    ],
    sources: [
      "Tam tahıllar (kepekli ekmek, yulaf)",
      "Kuru baklagiller (mercimek, fasulye)",
      "Ay çekirdeği, fındık",
      "Sakatatlar (özellikle karaciğer)",
      "Yumurta"
    ],
    advice: [
      "Rafine edilmiş unlu mamuller yerine tam tahıllı ürünler tercih edilmelidir.",
      "Alkol tiamin emilimini azaltır; düzenli tüketenlerde destek önerilir."
    ],
    summary: "Sinir sistemi ve enerji metabolizması için gereklidir.",
    risk: [
      "Alkol bağımlılar",
      "Aşırı rafine gıda tüketenler",
      "Kronik ishal yaşayan bireyler",
      "Uzun süre diüretik (idrar söktürücü) kullananlar"
    ]
  },
  {
    name: "Vitamin B2 (Riboflavin)",
    type: "Vitamin",
    description: "Enerji üretiminde görevli bir koenzimdir. Hücre metabolizması, cilt ve göz sağlığı için gereklidir.",
    daily: {
      erkek: "1.3 mg",
      kadin: "1.1 mg",
      gebelik: "1.9 mg",
      ust_sinir: "100 mg/gün"
    },
    functions: [
      "Karbonhidrat, yağ ve protein metabolizmasında koenzim olarak görev alır.",
      "Hücrelerin enerji üretimine katkı sağlar.",
      "Antioksidan savunma sisteminde rol alır (glutatyon redüktaz).",
      "Cilt, saç ve göz sağlığı için önemlidir.",
      "B6 ve B3 vitaminlerinin aktif formlarına dönüşümünü destekler."
    ],
    deficiency: [
      "Ağız kenarlarında çatlama (angular stomatit)",
      "Dudak kuruluğu, parlak kırmızı dil",
      "Gözde hassasiyet, ışığa duyarlılık",
      "Ciltte döküntüler",
      "Yorgunluk"
    ],
    excess: [
      "Fazlası idrarla atılır, toksik değildir.",
      "Aşırı dozda idrar parlak sarı renkte olabilir (zararsızdır)."
    ],
    sources: [
      "Süt ve süt ürünleri",
      "Yumurta",
      "Karaciğer",
      "Yeşil yapraklı sebzeler",
      "Tam tahıllar"
    ],
    advice: [
      "Günlük süt tüketimi riboflavin ihtiyacını karşılamada etkilidir.",
      "Riboflavin ısıya dayanıklıdır ama ışığa duyarlıdır — süt şeffaf şişede bekletilmemelidir."
    ],
    summary: "Enerji metabolizması ve doku sağlığı için gereklidir.",
    risk: [
      "Yetersiz ve dengesiz beslenen bireyler",
      "Veganlar (özellikle süt/et tüketmeyenler)",
      "Emilim bozukluğu olanlar",
      "Uzun süreli antibiyotik kullanımı"
    ]
  },
  {
    name: "Vitamin B3 (Niasin / Nikotinik Asit)",
    type: "Vitamin",
    description: "Enerji üretimi, DNA onarımı ve sinir sistemi sağlığı için önemli bir vitamindir.",
    daily: {
      erkek: "16 mg NE (niasin eşdeğeri)",
      kadin: "14 mg NE",
      ust_sinir: "35 mg/gün (takviye formu için)"
    },
    functions: [
      "NAD ve NADP gibi koenzimlerin yapısında yer alır (hücresel enerji üretimi).",
      "DNA onarımı ve hücre yenilenmesinde rol oynar.",
      "Kolesterol seviyesini düzenleyici etkisi vardır.",
      "Beyin fonksiyonlarını destekler.",
      "Cilt sağlığı ve sindirim sisteminin düzgün çalışması için önemlidir."
    ],
    deficiency: [
      "Pellegra hastalığı (3D):",
      "Dermatit: Güneşe maruz kalan ciltte kızarıklık, soyulma",
      "Diyare: Sürekli ishal",
      "Demans: Bellek bozukluğu, kafa karışıklığı",
      "İştahsızlık, halsizlik",
      "Ağız ve dil yaraları"
    ],
    excess: [
      "Yüksek doz takviye formu — nikotinik asit",
      "Ciltte kızarma, sıcak basması (niasin flush)",
      "Kaşıntı, mide bulantısı",
      "Karaciğer toksisitesi (uzun süre yüksek dozda kullanımda)"
    ],
    sources: [
      "Et, tavuk, balık",
      "Karaciğer",
      "Tam tahıllar",
      "Yer fıstığı",
      "Baklagiller"
    ],
    advice: [
      "Dengeli bir protein kaynağı tüketimi niasin ihtiyacını karşılar.",
      "Vücut ayrıca triptofandan niasin sentezleyebilir (60 mg triptofan → 1 mg niasin)."
    ],
    summary: "Enerji üretimi ve DNA onarımı için gereklidir.",
    risk: [
      "Mısır ağırlıklı diyetle beslenen topluluklar (niasin biyoyararlılığı düşüktür)",
      "Alkol bağımlılığı olanlar",
      "Emilim bozukluğu olan bireyler",
      "Yetersiz protein alan kişiler"
    ]
  },
  {
    name: "Vitamin B5 (Pantotenik Asit)",
    type: "Vitamin",
    description: "Enerji üretimi, yağ asidi sentezi ve hormon üretiminde görevli suda çözünen bir B vitaminidir.",
    daily: {
      yetiskin: "5 mg",
      gebelik: "6 mg",
      emzirme: "7 mg",
      ust_sinir: "Üst sınır belirlenmemiştir"
    },
    functions: [
      "Koenzim A'nın yapısında yer alır (enerji metabolizması).",
      "Yağ asidi sentezi ve yıkımında rol alır.",
      "Kolesterol, steroid hormonları ve hem sentezi için gereklidir.",
      "Yaraların iyileşmesinde destekleyicidir.",
      "Sinir iletimi ve karaciğer fonksiyonlarına katkı sağlar."
    ],
    deficiency: [
      "Eksiklik nadirdir ama aşırı yetersiz beslenmede görülebilir.",
      "Yorgunluk, baş ağrısı",
      "Uyuşma, karıncalanma (özellikle ayaklarda — 'burning feet' sendromu)",
      "İştahsızlık, bulantı",
      "Ruh hali değişiklikleri"
    ],
    excess: [
      "Çok yüksek dozlarda (10–20 g) ishal, mide bulantısı yapabilir.",
      "Genelde toksik değildir."
    ],
    sources: [
      "Tavuk, et, karaciğer",
      "Yumurta sarısı",
      "Tam tahıllar",
      "Avokado, mantar",
      "Yoğurt, süt"
    ],
    advice: [
      "Dengeli bir beslenmede eksikliği nadiren görülür.",
      "Aşırı işlenmiş gıdalarla beslenenlerde eksiklik riski artabilir."
    ],
    summary: "Enerji, yağ asidi ve hormon metabolizması için gereklidir.",
    risk: [
      "Çok düşük kalorili diyet yapanlar",
      "Emilim bozukluğu yaşayan bireyler",
      "Alkol bağımlılar"
    ]
  },
  {
    name: "Vitamin B6 (Piridoksin, Piridoksal, Piridoksamin)",
    type: "Vitamin",
    description: "Protein ve amino asit metabolizmasında görevli, sinir sistemi sağlığı için hayati bir vitamindir.",
    daily: {
      erkek: "1.3–1.7 mg",
      kadin: "1.3–1.5 mg",
      gebelik: "1.9 mg",
      ust_sinir: "100 mg/gün"
    },
    functions: [
      "Amino asit metabolizmasında koenzim olarak görev yapar.",
      "Hemoglobin sentezi için gereklidir.",
      "Sinir sistemi sağlığına katkı sağlar.",
      "Serotonin, dopamin, norepinefrin gibi nörotransmitter sentezinde rol oynar.",
      "Bağışıklık fonksiyonlarını destekler.",
      "Homosistein düzeylerini düşürerek kalp sağlığını korur."
    ],
    deficiency: [
      "Depresyon, irritabilite",
      "El ve ayaklarda karıncalanma (periferik nöropati)",
      "Dudaklarda çatlama, dilde kızarıklık",
      "Zayıf bağışıklık, yorgunluk",
      "Bebeklerde nöbet geçirme"
    ],
    excess: [
      "Uzun süreli yüksek doz alımında",
      "Sinir hasarı (periferik nöropati)",
      "Uyuşukluk, kas zayıflığı",
      "Koordinasyon bozukluğu"
    ],
    sources: [
      "Tavuk, hindi, ton balığı",
      "Patates, muz",
      "Ispanak, brokoli",
      "Karaciğer",
      "Kuruyemişler"
    ],
    advice: [
      "Protein alımı arttıkça B6 ihtiyacı da artar.",
      "Sinir sistemi sağlığı için B6, B12 ve folik asit birlikte alınmalıdır."
    ],
    summary: "Protein ve sinir sistemi sağlığı için gereklidir.",
    risk: [
      "Alkolik bireyler",
      "Diyaliz hastaları",
      "Doğum kontrol hapı kullanan kadınlar",
      "Emilim bozukluğu olan bireyler"
    ]
  },
  {
    name: "Vitamin B7 (Biotin / H Vitamini)",
    type: "Vitamin",
    description: "Karbonhidrat, yağ ve protein metabolizmasında görev alan; saç, cilt ve sinir sağlığı için önemli bir vitamindir.",
    daily: {
      yetiskin: "30 mcg",
      gebelik: "30 mcg",
      emzirme: "35 mcg",
      ust_sinir: "Üst sınır belirlenmemiştir (toksik değildir)"
    },
    functions: [
      "Karbonhidrat, yağ ve proteinlerin enerjiye dönüşümünde görev alır.",
      "DNA sentezine ve hücre büyümesine katkı sağlar.",
      "Saç ve tırnak sağlığı için destekleyicidir.",
      "Sinir sistemi sağlığına katkıda bulunur.",
      "Cilt yenilenmesini destekler."
    ],
    deficiency: [
      "Saç dökülmesi",
      "Ciltte kuruluk, pullanma, döküntü",
      "Tırnaklarda kırılma",
      "Yorgunluk, halsizlik",
      "Depresyon, halüsinasyonlar (ağır eksiklikte)"
    ],
    excess: [
      "Toksik değildir, fazlası idrarla atılır.",
      "Ancak yüksek doz takviyeler bazı kan testlerinin (T3/T4, troponin) sonuçlarını bozabilir."
    ],
    sources: [
      "Yumurta sarısı (pişmiş)",
      "Badem, ceviz",
      "Yer fıstığı",
      "Karaciğer",
      "Süt ve süt ürünleri",
      "Tam tahıllar"
    ],
    advice: [
      "Biotin bağırsak florası tarafından da sentezlenir.",
      "Çiğ yumurta beyazı uzun süreli tüketilirse biotin emilimini engeller (avidin proteini nedeniyle)."
    ],
    summary: "Saç, cilt ve sinir sağlığı için gereklidir.",
    risk: [
      "Yoğun antibiyotik kullanımı (bağırsak florası bozulursa)",
      "Çiğ yumurta beyazı tüketenler",
      "Gebeler (ihtiyaç artar)",
      "Emilim bozukluğu olan bireyler"
    ]
  },
  {
    name: "Vitamin B12 (Kobalamin)",
    type: "Vitamin",
    description: "Sinir sistemi sağlığı, DNA sentezi ve kırmızı kan hücresi üretimi için elzem olan suda çözünen bir vitamindir.",
    daily: {
      yetiskin: "2.4 mcg",
      gebelik: "2.6 mcg",
      emzirme: "2.8 mcg",
      ust_sinir: "Üst sınır belirlenmemiştir"
    },
    functions: [
      "DNA ve RNA sentezinde görev alır",
      "Kırmızı kan hücrelerinin üretiminde gereklidir",
      "Sinir hücrelerinin miyelin kılıfını korur (nörolojik fonksiyon)",
      "Homosistein düzeyini düşürerek kalp sağlığını destekler",
      "Enerji metabolizmasında yardımcıdır"
    ],
    deficiency: [
      "Megaloblastik anemi (B9 eksikliğiyle benzer)",
      "Dilin kızarması, ağızda yaralar",
      "Ellerde ve ayaklarda karıncalanma, uyuşma (nöropati)",
      "Denge kaybı",
      "Hafıza bozukluğu, konsantrasyon güçlüğü",
      "İleri düzeyde psikiyatrik belirtiler (depresyon, halüsinasyonlar)"
    ],
    excess: [
      "Genellikle toksik değildir, fazlası idrarla atılır",
      "Çok yüksek dozda enjeksiyon sonrası ciltte kızarıklık, nadiren baş dönmesi görülebilir"
    ],
    sources: [
      "Karaciğer",
      "Kırmızı et, tavuk, balık",
      "Yumurta",
      "Süt ve süt ürünleri",
      "B12 ile zenginleştirilmiş bitkisel ürünler (veganlar için)"
    ],
    advice: [
      "B12 hayvansal kaynaklı bir vitamindir. Vegan bireylerin düzenli takviye kullanması şarttır",
      "Emilimi için mide asidi ve 'intrinsic factor' gereklidir. Bu nedenle mide problemleri olan bireylerde eksiklik görülebilir"
    ],
    summary: "Sinir sistemi sağlığı ve kan hücresi üretimi için elzem",
    risk: [
      "Vegan ve vejetaryenler (hayvansal kaynak tüketmeyenler)",
      "Yaşlı bireyler (emilim azalır)",
      "Atrofik gastrit hastaları",
      "Mide ameliyatı geçirenler (bypass, gastrektomi)",
      "Proton pompa inhibitörü (mide asidi baskılayıcı) ilaç kullananlar"
    ]
  }
];

const mineralData = [
  {
    name: "Kalsiyum",
    type: "Mineral",
    description: "Kemik ve diş sağlığı için en önemli minerallerden biridir. Kas fonksiyonları ve sinir iletimi için de gereklidir.",
    daily: {
      yetiskin: "1000-1200 mg",
      cocuk: "700-1300 mg (yaşa göre)",
      ust_sinir: "2500 mg/gün"
    },
    functions: [
      "Kemik ve diş yapısının oluşturulması ve korunması",
      "Kas kasılması ve gevşemesi",
      "Sinir iletimi",
      "Kan pıhtılaşması",
      "Hormon salgılanması"
    ],
    deficiency: [
      "Osteoporoz (kemik erimesi)",
      "Kas krampları",
      "Diş çürükleri",
      "Tırnak kırılganlığı",
      "Uyku problemleri"
    ],
    excess: [
      "Böbrek taşı oluşumu",
      "Kabızlık",
      "Demir ve çinko emiliminin azalması",
      "Böbrek fonksiyonlarında bozulma"
    ],
    sources: [
      "Süt ve süt ürünleri",
      "Yeşil yapraklı sebzeler",
      "Kuruyemişler",
      "Sardalya",
      "Tofu"
    ],
    advice: [
      "D vitamini ile birlikte alınması emilimi artırır",
      "Kafein ve alkol tüketimi kalsiyum emilimini azaltır",
      "Günlük süt ürünü tüketimi önemlidir"
    ],
    summary: "Kemik ve diş sağlığı için temel mineral",
    risk: [
      "Menopoz sonrası kadınlar",
      "Laktoz intoleransı olanlar",
      "Vejetaryenler",
      "Yaşlılar"
    ]
  },
  {
    name: "Demir",
    type: "Mineral",
    description: "Kırmızı kan hücrelerinin yapımı için gerekli olan temel bir mineraldir. Oksijen taşınmasında kritik rol oynar.",
    daily: {
      erkek: "8 mg",
      kadin: "18 mg",
      gebelik: "27 mg",
      ust_sinir: "45 mg/gün"
    },
    functions: [
      "Hemoglobin yapımı",
      "Oksijen taşınması",
      "Enerji üretimi",
      "Bağışıklık sistemi",
      "Bilişsel fonksiyonlar"
    ],
    deficiency: [
      "Anemi (kansızlık)",
      "Yorgunluk",
      "Baş dönmesi",
      "Nefes darlığı",
      "Soluk cilt"
    ],
    excess: [
      "Karaciğer hasarı",
      "Kabızlık",
      "Mide bulantısı",
      "Karın ağrısı"
    ],
    sources: [
      "Kırmızı et",
      "Karaciğer",
      "Kuru baklagiller",
      "Ispanak",
      "Pekmez"
    ],
    advice: [
      "C vitamini ile birlikte alınması emilimi artırır",
      "Çay ve kahve tüketimi emilimi azaltır",
      "Vejetaryenler için bitkisel kaynaklar önemlidir"
    ],
    summary: "Kan yapımı ve oksijen taşınması için gerekli",
    risk: [
      "Adet gören kadınlar",
      "Vejetaryenler",
      "Gebeler",
      "Çocuklar"
    ]
  },
  {
    name: "Magnezyum",
    type: "Mineral",
    description: "300'den fazla enzimatik reaksiyonda görev alan, kas ve sinir sistemi için kritik bir mineraldir.",
    daily: {
      erkek: "400-420 mg",
      kadin: "310-320 mg",
      gebelik: "350-360 mg",
      ust_sinir: "350 mg/gün (takviye için)"
    },
    functions: [
      "Kas ve sinir fonksiyonları",
      "Enerji üretimi",
      "Protein sentezi",
      "Kemik sağlığı",
      "Kalp ritmi düzenlemesi"
    ],
    deficiency: [
      "Kas krampları",
      "Yorgunluk",
      "Uyku problemleri",
      "Anksiyete",
      "Kalp ritim bozuklukları"
    ],
    excess: [
      "İshal",
      "Mide bulantısı",
      "Düşük tansiyon",
      "Nefes almada zorluk"
    ],
    sources: [
      "Kuruyemişler",
      "Tam tahıllar",
      "Yeşil yapraklı sebzeler",
      "Baklagiller",
      "Avokado"
    ],
    advice: [
      "Stres durumunda ihtiyaç artar",
      "Alkol tüketimi magnezyum kaybını artırır",
      "Düzenli egzersiz yapanlar için önemlidir"
    ],
    summary: "Kas ve sinir sistemi için temel mineral",
    risk: [
      "Tip 2 diyabet hastaları",
      "Alkol kullananlar",
      "Yaşlılar",
      "Gebeler"
    ]
  },
  {
    name: "Çinko",
    type: "Mineral",
    description: "Bağışıklık, yara iyileşmesi, cilt sağlığı ve hormon üretimi gibi çok sayıda hayati süreçte yer alan esansiyel iz mineraldir.",
    daily: {
      erkek: "11 mg",
      kadin: "8 mg",
      gebelik: "11 mg",
      ust_sinir: "40 mg"
    },
    functions: [
      "Bağışıklık sistemini güçlendirir",
      "Yara iyileşmesini hızlandırır",
      "DNA sentezi ve hücre bölünmesi için gereklidir",
      "Cilt, saç ve tırnak sağlığına katkı sağlar",
      "Tat ve koku duyusunda rol oynar",
      "Antioksidan savunmaya katkı sağlar",
      "Hormon üretimi (özellikle testosteron) için önemlidir"
    ],
    deficiency: [
      "Bağışıklık sisteminde zayıflık",
      "Sık enfeksiyon geçirme",
      "Saç dökülmesi",
      "Tat ve koku duyusunda azalma",
      "Ciltte lezyonlar, geç iyileşen yaralar",
      "Büyüme geriliği (çocuklarda)"
    ],
    excess: [
      "Bulantı, kusma, ishal",
      "Bakır emiliminde azalma (anemi riski)",
      "Bağışıklık sisteminde baskılanma (çok yüksek dozda)"
    ],
    sources: [
      "Kırmızı et, tavuk, hindi",
      "Kabak çekirdeği, kaju, badem",
      "Nohut, mercimek",
      "Tam tahıllar",
      "Yumurta"
    ],
    advice: [
      "Bitkisel kaynaklardaki çinko fitatlar nedeniyle daha düşük emilir",
      "Hayvansal proteinle birlikte alındığında biyoyararlanımı artar"
    ],
    summary: "Bağışıklık ve hücre yenilenmesi için kritik mineral",
    risk: [
      "Vegan ve vejetaryenler",
      "Sindirim sistemi hastalığı olanlar (Crohn, çölyak)",
      "Emziren kadınlar",
      "Aşırı terleyen bireyler (sporcular)"
    ]
  },
  {
    name: "Fosfor",
    type: "Mineral",
    description: "Kemik sağlığı, enerji metabolizması ve hücre yapısı için önemli olan makromineraldir.",
    daily: {
      yetiskin: "700 mg",
      gebelik: "700-1250 mg",
      emzirme: "700-1250 mg",
      ust_sinir: "4000 mg"
    },
    functions: [
      "Kemik ve dişlerin yapısında (kalsiyumla birlikte) bulunur",
      "ATP, DNA ve RNA yapısında yer alır (enerji üretimi ve genetik bilgi taşıma)",
      "Asit-baz dengesinin sağlanmasında rol alır",
      "Hücre zarlarının (fosfolipid) yapısında yer alır",
      "Kas ve sinir fonksiyonları için gereklidir"
    ],
    deficiency: [
      "Kemik ağrısı ve zayıflığı",
      "Kas zayıflığı",
      "Yorgunluk, iştahsızlık",
      "Sinir sistemi bozuklukları",
      "Kilo kaybı"
    ],
    excess: [
      "Böbrek hastalarında serum fosforu yükselebilir (hiperfosfatemi)",
      "Kalsiyum ile ters ilişkilidir; fazla fosfor → kalsiyum eksikliği → kemik erimesi",
      "Kas seğirmeleri, kalsiyumun dokularda birikmesi"
    ],
    sources: [
      "Et, tavuk, balık",
      "Süt ve süt ürünleri",
      "Yumurta",
      "Baklagiller",
      "Tam tahıllar",
      "Kuruyemişler"
    ],
    advice: [
      "Dengeli bir beslenme ile eksiklik nadirdir",
      "Fazla miktarda işlenmiş gıda (özellikle fosfat katkılı içecekler) tüketimi fosfor yükünü artırır"
    ],
    summary: "Kemik sağlığı ve enerji metabolizması için temel mineral",
    risk: [
      "Alkol bağımlılığı olan bireyler",
      "Düşük proteinli ve dengesiz diyet yapanlar",
      "D vitamini eksikliği olanlar",
      "Uzun süre antasit (asit baskılayıcı) ilaç kullananlar"
    ]
  },
  {
    name: "Potasyum",
    type: "Mineral",
    description: "Kas kasılması, sinir iletimi ve sıvı-elektrolit dengesi için temel mineraldir. Kalp sağlığı açısından da çok kritiktir.",
    daily: {
      yetiskin: "4700 mg",
      ust_sinir: "Besinle alım için belirlenmemiş, ancak takviye formunda dikkatli olunmalıdır"
    },
    functions: [
      "Hücre içi sıvı dengesinin sağlanmasında ana mineraldir",
      "Kas kasılması ve sinir iletimi için gereklidir",
      "Kalp ritmini düzenler",
      "Kan basıncını düşürmeye yardımcı olur (sodyumun tersine)",
      "Asit-baz dengesinin korunmasına katkı sağlar"
    ],
    deficiency: [
      "Kas zayıflığı, kramplar",
      "Kalp ritim bozuklukları (aritmi)",
      "Yorgunluk, halsizlik",
      "Kabızlık",
      "Sinir iletiminde bozulma"
    ],
    excess: [
      "Düzensiz kalp atışları",
      "Kas felci",
      "Ani kalp durması (çok yüksek dozda)"
    ],
    sources: [
      "Muz, avokado",
      "Patates, ıspanak, domates",
      "Mercimek, kuru fasulye",
      "Yoğurt, süt",
      "Portakal, kavun"
    ],
    advice: [
      "Günlük 4-5 porsiyon sebze ve meyve tüketimi önerilir",
      "İşlenmiş gıdalar potasyumdan çok sodyum içerdiği için potasyum yetersizliği gelişebilir"
    ],
    summary: "Kalp sağlığı ve kas fonksiyonları için kritik mineral",
    risk: [
      "Diüretik (idrar söktürücü) kullanan bireyler",
      "Aşırı terleyen sporcular",
      "Kronik ishal ya da kusma yaşayanlar",
      "Yetersiz sebze-meyve tüketen bireyler"
    ]
  },
  {
    name: "Sodyum",
    type: "Mineral",
    description: "Vücut sıvı dengesi, sinir iletimi ve kas kasılması için gerekli bir elektrolittir.",
    daily: {
      ideal: "1500 mg",
      ust_sinir: "2300 mg (yaklaşık 1 çay kaşığı tuz)",
      ortalama: "3000-5000 mg (fazla)"
    },
    functions: [
      "Hücre dışı sıvıların dengesini sağlar",
      "Kasların kasılması ve sinir hücrelerinin çalışması için gereklidir",
      "Kan basıncını düzenler",
      "Asit-baz dengesine katkıda bulunur"
    ],
    deficiency: [
      "Baş dönmesi, sersemlik",
      "Kas krampları",
      "Bilinç bulanıklığı, halsizlik",
      "Mide bulantısı",
      "Şiddetli durumlarda nöbet, koma"
    ],
    excess: [
      "Yüksek tansiyon (hipertansiyon)",
      "Böbrek yükünde artış",
      "Kalp-damar hastalıkları riski",
      "Sıvı tutulumu, ödem",
      "Mide kanseri (çok tuzlu gıdalarla ilişkili)"
    ],
    sources: [
      "Sofra tuzu",
      "Turşu, zeytin, peynir gibi tuzlanmış gıdalar",
      "İşlenmiş gıdalar (hazır çorba, cips, konserve vb.)",
      "Ekmek ve fırın ürünleri (gizli tuz kaynakları)"
    ],
    advice: [
      "Günlük 5 gramdan fazla tuz tüketilmemeli",
      "Az tuzlu ürünler tercih edilmeli",
      "Potasyumdan zengin beslenme (meyve/sebze) fazla sodyumun etkisini azaltır"
    ],
    summary: "Sıvı dengesi ve sinir iletimi için temel elektrolit",
    risk: [
      "Yüksek tansiyon hastaları",
      "Kalp yetmezliği, böbrek hastalığı olanlar",
      "Aşırı terleyenler (sporcular) – bu durumda takviye gerekebilir",
      "Yaşlılar (sıvı dengesi bozuklukları riski artar)"
    ]
  },
  {
    name: "Selenyum",
    type: "Mineral",
    description: "Vücutta antioksidan savunma, tiroid fonksiyonu ve bağışıklık sistemi için gerekli olan güçlü bir eser mineraldir.",
    daily: {
      yetiskin: "55 mcg",
      gebelik: "60 mcg",
      emzirme: "70 mcg",
      ust_sinir: "400 mcg"
    },
    functions: [
      "Glutatyon peroksidaz enziminin yapısında yer alır (antioksidan savunma)",
      "Hücreleri oksidatif strese karşı korur",
      "Bağışıklık sistemini güçlendirir",
      "Tiroid hormonlarının metabolizmasında görev alır",
      "Erkeklerde sperm sağlığı ve hareketliliği üzerinde etkilidir"
    ],
    deficiency: [
      "Bağışıklık zayıflığı",
      "Kas zayıflığı, kas ağrısı",
      "Yorgunluk",
      "Keshan hastalığı (Çin'de selenyum eksikliğiyle ilişkili kalp hastalığı)",
      "Erkeklerde fertilite azalması",
      "Tiroid fonksiyon bozuklukları"
    ],
    excess: [
      "Tırnaklarda kırılma",
      "Saç dökülmesi",
      "Sarımsak benzeri nefes kokusu",
      "Mide bulantısı",
      "Sinirlilik, nörolojik etkiler"
    ],
    sources: [
      "Brezilya cevizi (çok yüksek miktarda içerir – dikkatli tüketilmeli)",
      "Ton balığı, sardalya",
      "Karaciğer",
      "Yumurta",
      "Tam tahıllar"
    ],
    advice: [
      "Haftada 2-3 adet Brezilya cevizi, ihtiyacı karşılayabilir ancak aşırıya kaçılmamalı",
      "Selenyum toprak içeriğine bağlı olarak besinlerde farklı oranlarda bulunur"
    ],
    summary: "Antioksidan savunma ve tiroid sağlığı için güçlü mineral",
    risk: [
      "Selenyum açısından fakir topraklarda yaşayanlar",
      "Bağırsak emilim bozukluğu olanlar",
      "TPN (damardan beslenen) hastalar",
      "Düşük proteinli diyet yapanlar"
    ]
  },
  {
    name: "Bakır",
    type: "Mineral",
    description: "Demir metabolizması, bağ dokusu sentezi, antioksidan savunma ve sinir sistemi için gerekli iz mineraldir.",
    daily: {
      yetiskin: "900 mcg",
      gebelik: "1000 mcg",
      emzirme: "1300 mcg",
      ust_sinir: "10.000 mcg (10 mg)"
    },
    functions: [
      "Demirin emilimi ve taşınmasında görev alır (hemoglobin sentezi)",
      "SOD (süperoksit dismutaz) enzimiyle antioksidan savunma sağlar",
      "Bağ dokusu ve kemik yapımında görevlidir",
      "Sinir sisteminde miyelin oluşumuna katkı sağlar",
      "Melanin sentezinde ve cilt pigmentasyonunda rol oynar"
    ],
    deficiency: [
      "Anemi (mikrositik/hipokromik)",
      "Bağışıklık sistemi zayıflığı",
      "Saç renginde solukluk, pigmentasyon bozuklukları",
      "Nörolojik bozukluklar (denge kaybı, kas zayıflığı)",
      "Osteoporoz"
    ],
    excess: [
      "Mide bulantısı, kusma",
      "Karaciğer hasarı",
      "Wilson hastalığında (genetik birikim): beyin ve karaciğerde ciddi toksisite"
    ],
    sources: [
      "Karaciğer",
      "Kuruyemişler (badem, fındık)",
      "Kabuklu deniz ürünleri",
      "Tam tahıllar",
      "Bitter çikolata"
    ],
    advice: [
      "Aşırı çinko alımı bakır emilimini azaltır",
      "Bitkisel ağırlıklı ve çeşitli beslenme eksikliği önlemeye yardımcı olur"
    ],
    summary: "Demir metabolizması ve antioksidan savunma için gerekli mineral",
    risk: [
      "TPN (damardan beslenen) bireyler",
      "Emilim bozukluğu yaşayanlar",
      "Aşırı çinko takviyesi kullananlar",
      "Prematüre bebekler"
    ]
  },
  {
    name: "Manganez",
    type: "Mineral",
    description: "Kemik sağlığı, bağ dokusu oluşumu ve antioksidan savunma sisteminde görev alan iz mineraldir.",
    daily: {
      erkek: "2.3 mg",
      kadin: "1.8 mg",
      ust_sinir: "11 mg/gün (takviyelerde dikkatli olunmalı)"
    },
    functions: [
      "Kemik oluşumu ve sağlığında rol oynar",
      "Bağ dokusu sentezine katkı sağlar (kollajen)",
      "Enerji metabolizmasında koenzim olarak görev yapar",
      "Antioksidan enzim (manganez-SOD) yapısında yer alır",
      "Beyin fonksiyonlarını ve sinir sistemi sağlığını destekler"
    ],
    deficiency: [
      "Kemik zayıflığı",
      "Büyüme geriliği",
      "Glukoz intoleransı",
      "Denge problemleri",
      "Deride hassasiyet"
    ],
    excess: [
      "Aşırı alımda nörolojik semptomlar (Parkinson benzeri titreme, kas sertliği)",
      "En çok iş yerlerinde yüksek manganez maruziyeti olanlarda görülür (endüstriyel toksisite)"
    ],
    sources: [
      "Tam tahıllar",
      "Kuruyemişler (özellikle fındık)",
      "Ananas, çilek",
      "Ispanak, yeşil yapraklı sebzeler",
      "Çay"
    ],
    advice: [
      "Bitkisel besinlerde yaygın olduğu için vejetaryen diyetlerde yeterli düzeydedir",
      "Aşırı demir alımı, manganez emilimini azaltabilir"
    ],
    summary: "Kemik sağlığı ve antioksidan savunma için gerekli mineral",
    risk: [
      "Emilim bozukluğu olan bireyler",
      "Yetersiz ve dengesiz beslenenler",
      "Aşırı demir takviyesi kullananlar"
    ]
  },
  {
    name: "Krom",
    type: "Mineral",
    description: "İnsülinin etkisini artıran, glukoz ve lipid metabolizmasında görevli iz mineraldir.",
    daily: {
      erkek: "35 mcg",
      kadin: "25 mcg",
      ust_sinir: "Belirlenmemiş (ancak 1000 mcg üzeri dozlarda dikkatli olunmalı)"
    },
    functions: [
      "İnsülinin hücre üzerindeki etkisini artırır (glukoz metabolizması)",
      "Kan şekeri dengesine yardımcı olur",
      "Yağ ve protein metabolizmasında yer alır",
      "Hücresel enerji üretimini destekler"
    ],
    deficiency: [
      "Glukoz intoleransı (insülin direnci benzeri tablo)",
      "Kan şekeri dalgalanmaları",
      "Yorgunluk",
      "Kilo alımı eğilimi",
      "Anksiyete, hafif nörolojik semptomlar"
    ],
    excess: [
      "Takviyelerde çok yüksek dozlarda alım:",
      "Böbrek hasarı",
      "Karaciğer toksisitesi",
      "Endüstriyel krom bileşikleri (Cr6+) toksiktir ama besinlerdeki trivalan krom güvenlidir"
    ],
    sources: [
      "Tam tahıllar",
      "Brokoli",
      "Elma",
      "Et, karaciğer",
      "Yumurta sarısı"
    ],
    advice: [
      "Rafine karbonhidratlar krom atılımını artırır (beyaz ekmek, şeker)",
      "Dengeli bir diyet krom ihtiyacını karşılamaya genellikle yeterlidir"
    ],
    summary: "İnsülin etkinliği ve glukoz metabolizması için gerekli mineral",
    risk: [
      "Tip 2 diyabet hastaları",
      "Aşırı şekerli besin tüketen bireyler",
      "Düşük proteinli diyet yapanlar",
      "TPN ile beslenen hastalar"
    ]
  },
  {
    name: "Molibden",
    type: "Mineral",
    description: "Vücutta bazı enzimlerin çalışması için gerekli olan, az miktarda ihtiyaç duyulan ama önemli bir iz mineraldir.",
    daily: {
      yetiskin: "45 mcg",
      gebelik: "50 mcg",
      emzirme: "50 mcg",
      ust_sinir: "2000 mcg"
    },
    functions: [
      "Sülfür, purin ve bazı toksinlerin metabolizmasında görev alan enzimlerin kofaktörüdür",
      "Vücuttaki atık maddelerin detoksifikasyonuna katkı sağlar",
      "DNA ve protein sentezine yardımcı olur",
      "Oksidatif enzim fonksiyonlarına katılır"
    ],
    deficiency: [
      "Baş ağrısı, bilinç değişiklikleri",
      "Nöbetler (genetik molibden kofaktör eksikliğinde)",
      "Zihinsel gerilik (nadir görülen sendromlarda)"
    ],
    excess: [
      "Gut benzeri semptomlar (ürik asit artışı)",
      "Eklem ağrısı",
      "Karaciğer ve böbrek stresine katkı"
    ],
    sources: [
      "Mercimek, fasulye",
      "Tam tahıllar",
      "Sakatatlar (özellikle karaciğer)",
      "Kuruyemişler"
    ],
    advice: [
      "Dengeli bir diyette molibden eksikliği riski yoktur",
      "Yüksek proteinli ve baklagil ağırlıklı diyetler molibden açısından zengindir"
    ],
    summary: "Enzim fonksiyonları ve detoksifikasyon için gerekli iz mineral",
    risk: [
      "Genetik molibden kofaktör eksikliği olan bireyler (çok nadir)",
      "TPN (total parenteral beslenme) hastaları (uzun süreli damar yoluyla beslenenler)"
    ]
  }
];

const vitaminMineralData = [...vitaminsData, ...mineralData];

// Yardımcı fonksiyon: Günlük ihtiyaçları anahtar-değer olarak alt alta göster
function renderDaily(daily: any) {
  if (typeof daily === "string") {
    return <li className="text-blue-700">{daily}</li>;
  }
  return (
    <>
      {Object.entries(daily).map(([key, value]) => {
        let label = key;
        if (key === "yetiskin") label = "Yetişkinler";
        if (key === "yasli") label = "Yaşlılar";
        if (key === "cocuk") label = "Bebekler ve Çocuklar";
        if (key === "hamile") label = "Hamileler";
        if (key === "emziren") label = "Emzirenler";
        if (key === "gebelik") label = "Gebelik";
        if (key === "emzirme") label = "Emzirme";
        if (key === "erkek") label = "Erkekler";
        if (key === "kadin") label = "Kadınlar";
        if (key === "ust_sinir") label = "Üst Sınır";
        if (key === "sigara") label = "Sigara İçenler";
        if (key === "ekstra") label = "Ekstra";
        return <li key={key} className="text-blue-700">{label}: {String(value)}</li>;
      })}
    </>
  );
}

export default function VitaminMineralInfo() {
  const [searchTerm, setSearchTerm] = useState("");

  // Arama fonksiyonu
  const filteredData = vitaminMineralData.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Harf + v araması (örn: "k v" -> K vitamini, "b v" -> B vitaminleri)
    if (searchLower.match(/^[a-z]\s*v$/)) {
      const letter = searchLower[0];
      return item.type === "Vitamin" && item.name.toLowerCase().startsWith(`vitamin ${letter}`);
    }
    
    // Tek harf araması (örn: "a" -> A vitamini, A ile başlayan mineraller)
    if (searchLower.length === 1) {
      const letter = searchLower[0];
      // Vitamin A gibi özel durumlar için
      if (item.type === "Vitamin" && item.name.toLowerCase().startsWith(`vitamin ${letter}`)) {
        return true;
      }
      // Normal isim kontrolü
      return item.name.toLowerCase().startsWith(letter);
    }
    
    // Tam kelime araması
    return item.name.toLowerCase().includes(searchLower);
  });

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Vitamin ve Mineral Bilgi Rehberi</h1>
      <p className="mb-8 text-center text-muted-foreground">
        Her bir vitamin ve mineralin görevleri, eksiklik ve fazlalık belirtileri, en iyi kaynakları ve beslenme önerileri aşağıda detaylıca açıklanmıştır.
      </p>
      
      {/* Arama kutusu */}
      <div className="mb-8 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Vitamin veya mineral ara... (örn: k vitamini, demir)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-500">
            {filteredData.length} sonuç bulundu
          </p>
        )}
      </div>

      <div className="space-y-8">
        {/* Tüm vitamin/mineraller için modern Card + Accordion */}
        {filteredData.map((item, idx) => {
          // Renk ve ikon seçimi
          let color = 'slate';
          let iconColor = <Info className="h-8 w-8 text-slate-500" />;
          let border = 'border-slate-200';
          let from = 'from-slate-50';
          let text = 'text-slate-700';
          let badgeBg = 'bg-slate-100 text-slate-800';
          let iconBg = 'bg-slate-200';
          if (item.name.startsWith('Vitamin D')) {
            color = 'yellow';
            iconColor = <Sun className="h-8 w-8 text-yellow-500" />;
            border = 'border-yellow-200';
            from = 'from-yellow-50';
            text = 'text-yellow-700';
            badgeBg = 'bg-yellow-100 text-yellow-800';
            iconBg = 'bg-yellow-200';
          } else if (item.name.startsWith('Vitamin B12')) {
            color = 'indigo';
            iconColor = <span className="text-3xl">🧬</span>;
            border = 'border-indigo-200';
            from = 'from-indigo-50';
            text = 'text-indigo-700';
            badgeBg = 'bg-indigo-100 text-indigo-800';
            iconBg = 'bg-indigo-200';
          } else if (item.name.startsWith('Vitamin B1')) {
            color = 'purple';
            iconColor = <span className="text-3xl">🍞</span>;
            border = 'border-purple-200';
            from = 'from-purple-50';
            text = 'text-purple-700';
            badgeBg = 'bg-purple-100 text-purple-800';
            iconBg = 'bg-purple-200';
          } else if (item.name.startsWith('Vitamin A')) {
            color = 'orange';
            iconColor = <Carrot className="h-8 w-8 text-orange-500" />;
            border = 'border-orange-200';
            from = 'from-orange-50';
            text = 'text-orange-700';
            badgeBg = 'bg-orange-100 text-orange-800';
            iconBg = 'bg-orange-200';
          } else if (item.name.startsWith('Vitamin E')) {
            color = 'green';
            iconColor = <Leaf className="h-8 w-8 text-green-500" />;
            border = 'border-green-200';
            from = 'from-green-50';
            text = 'text-green-700';
            badgeBg = 'bg-green-100 text-green-800';
            iconBg = 'bg-green-200';
          } else if (item.name.startsWith('Vitamin K')) {
            color = 'emerald';
            iconColor = <Leaf className="h-8 w-8 text-emerald-500" />;
            border = 'border-emerald-200';
            from = 'from-emerald-50';
            text = 'text-emerald-700';
            badgeBg = 'bg-emerald-100 text-emerald-800';
            iconBg = 'bg-emerald-200';
          } else if (item.name.startsWith('Vitamin C')) {
            color = 'blue';
            iconColor = <Utensils className="h-8 w-8 text-blue-500" />;
            border = 'border-blue-200';
            from = 'from-blue-50';
            text = 'text-blue-700';
            badgeBg = 'bg-blue-100 text-blue-800';
            iconBg = 'bg-blue-200';
          } else if (item.name.startsWith('Vitamin B2')) {
            color = 'blue';
            iconColor = <Utensils className="h-8 w-8 text-blue-500" />;
            border = 'border-blue-200';
            from = 'from-blue-50';
            text = 'text-blue-700';
            badgeBg = 'bg-blue-100 text-blue-800';
            iconBg = 'bg-blue-200';
          } else if (item.name.startsWith('Vitamin B3')) {
            color = 'blue';
            iconColor = <Utensils className="h-8 w-8 text-blue-500" />;
            border = 'border-blue-200';
            from = 'from-blue-50';
            text = 'text-blue-700';
            badgeBg = 'bg-blue-100 text-blue-800';
            iconBg = 'bg-blue-200';
          } else if (item.name.startsWith('Vitamin B5')) {
            color = 'blue';
            iconColor = <Utensils className="h-8 w-8 text-blue-500" />;
            border = 'border-blue-200';
            from = 'from-blue-50';
            text = 'text-blue-700';
            badgeBg = 'bg-blue-100 text-blue-800';
            iconBg = 'bg-blue-200';
          } else if (item.name.startsWith('Vitamin B6')) {
            color = 'blue';
            iconColor = <Utensils className="h-8 w-8 text-blue-500" />;
            border = 'border-blue-200';
            from = 'from-blue-50';
            text = 'text-blue-700';
            badgeBg = 'bg-blue-100 text-blue-800';
            iconBg = 'bg-blue-200';
          } else if (item.name.startsWith('Vitamin B7')) {
            color = 'blue';
            iconColor = <Utensils className="h-8 w-8 text-blue-500" />;
            border = 'border-blue-200';
            from = 'from-blue-50';
            text = 'text-blue-700';
            badgeBg = 'bg-blue-100 text-blue-800';
            iconBg = 'bg-blue-200';
          } else if (item.name === "Kalsiyum") {
            color = 'cyan';
            iconColor = <span className="text-3xl">🦴</span>;
            border = 'border-cyan-200';
            from = 'from-cyan-50';
            text = 'text-cyan-700';
            badgeBg = 'bg-cyan-100 text-cyan-800';
            iconBg = 'bg-cyan-200';
          } else if (item.name === "Demir") {
            color = 'rose';
            iconColor = <span className="text-3xl">🩸</span>;
            border = 'border-rose-200';
            from = 'from-rose-50';
            text = 'text-rose-700';
            badgeBg = 'bg-rose-100 text-rose-800';
            iconBg = 'bg-rose-200';
          } else if (item.name === "Magnezyum") {
            color = 'violet';
            iconColor = <span className="text-3xl">⚡</span>;
            border = 'border-violet-200';
            from = 'from-violet-50';
            text = 'text-violet-700';
            badgeBg = 'bg-violet-100 text-violet-800';
            iconBg = 'bg-violet-200';
          } else if (item.name === "Çinko") {
            color = 'teal';
            iconColor = <span className="text-3xl">🛡️</span>;
            border = 'border-teal-200';
            from = 'from-teal-50';
            text = 'text-teal-700';
            badgeBg = 'bg-teal-100 text-teal-800';
            iconBg = 'bg-teal-200';
          } else if (item.name === "Fosfor") {
            color = 'lime';
            iconColor = <span className="text-3xl">💪</span>;
            border = 'border-lime-200';
            from = 'from-lime-50';
            text = 'text-lime-700';
            badgeBg = 'bg-lime-100 text-lime-800';
            iconBg = 'bg-lime-200';
          } else if (item.name === "Potasyum") {
            color = 'amber';
            iconColor = <span className="text-3xl">❤️</span>;
            border = 'border-amber-200';
            from = 'from-amber-50';
            text = 'text-amber-700';
            badgeBg = 'bg-amber-100 text-amber-800';
            iconBg = 'bg-amber-200';
          } else if (item.name === "Sodyum") {
            color = 'sky';
            iconColor = <span className="text-3xl">💧</span>;
            border = 'border-sky-200';
            from = 'from-sky-50';
            text = 'text-sky-700';
            badgeBg = 'bg-sky-100 text-sky-800';
            iconBg = 'bg-sky-200';
          } else if (item.name === "Selenyum") {
            color = 'fuchsia';
            iconColor = <span className="text-3xl">✨</span>;
            border = 'border-fuchsia-200';
            from = 'from-fuchsia-50';
            text = 'text-fuchsia-700';
            badgeBg = 'bg-fuchsia-100 text-fuchsia-800';
            iconBg = 'bg-fuchsia-200';
          } else if (item.name === "Bakır") {
            color = 'orange';
            iconColor = <span className="text-3xl">🔶</span>;
            border = 'border-orange-200';
            from = 'from-orange-50';
            text = 'text-orange-700';
            badgeBg = 'bg-orange-100 text-orange-800';
            iconBg = 'bg-orange-200';
          } else if (item.name === "Manganez") {
            color = 'purple';
            iconColor = <span className="text-3xl">💎</span>;
            border = 'border-purple-200';
            from = 'from-purple-50';
            text = 'text-purple-700';
            badgeBg = 'bg-purple-100 text-purple-800';
            iconBg = 'bg-purple-200';
          } else if (item.name === "Krom") {
            color = 'indigo';
            iconColor = <span className="text-3xl">⚡</span>;
            border = 'border-indigo-200';
            from = 'from-indigo-50';
            text = 'text-indigo-700';
            badgeBg = 'bg-indigo-100 text-indigo-800';
            iconBg = 'bg-indigo-200';
          } else if (item.name === "Molibden") {
            color = 'violet';
            iconColor = <span className="text-3xl">🔮</span>;
            border = 'border-violet-200';
            from = 'from-violet-50';
            text = 'text-violet-700';
            badgeBg = 'bg-violet-100 text-violet-800';
            iconBg = 'bg-violet-200';
          } else if (item.name === "Florür") {
            color = 'cyan';
            iconColor = <span className="text-3xl">💎</span>;
            border = 'border-cyan-200';
            from = 'from-cyan-50';
            text = 'text-cyan-700';
            badgeBg = 'bg-cyan-100 text-cyan-800';
            iconBg = 'bg-cyan-200';
          }
          return (
            <div key={item.name} className={`bg-gradient-to-br ${from} to-white rounded-2xl shadow-xl ${border} hover:shadow-2xl transition-shadow duration-300 p-0 overflow-hidden`}>
              <div className="flex items-center gap-4 px-6 pt-6 pb-2">
                <div className={`${iconBg} rounded-full p-3 flex items-center justify-center`}>{iconColor}</div>
                <div>
                  <h2 className={`text-2xl font-bold ${text} flex items-center gap-2`}>{item.name} <span className={`text-base font-normal ${text.replace('700','500')}`}>({item.type})</span></h2>
                  <div className={`mt-1 inline-block ${badgeBg} text-xs font-semibold px-3 py-1 rounded-full shadow-sm`}>{item.summary}</div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <p className="mb-4 mt-2 text-slate-700 text-base">{item.description}</p>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="daily">
                    <AccordionTrigger><Info className="inline mr-2 text-blue-400" />Günlük İhtiyaç</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 space-y-1">
                        {renderDaily(item.daily)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="functions">
                    <AccordionTrigger><CheckCircle className="inline mr-2 text-green-500" />Görevleri</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 space-y-1">
                        {item.functions.map((f, i) => <li key={i} className="text-green-700">{f}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="deficiency">
                    <AccordionTrigger><AlertTriangle className="inline mr-2 text-red-500" />Eksikliğinde Görülen Belirtiler</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 space-y-1">
                        {item.deficiency.map((d, i) => <li key={i} className="text-red-700">{d}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="excess">
                    <AccordionTrigger><AlertTriangle className="inline mr-2 text-amber-500" />Fazlalığında Görülen Belirtiler</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 space-y-1">
                        {item.excess.map((d, i) => <li key={i} className="text-amber-700">{d}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="sources">
                    <AccordionTrigger><Leaf className="inline mr-2 text-green-600" />En İyi Kaynaklar</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 space-y-1">
                        {item.sources.map((d, i) => <li key={i} className="text-green-700">{d}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="advice">
                    <AccordionTrigger><Info className="inline mr-2 text-indigo-500" />Beslenme Önerisi</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 space-y-1">
                        {Array.isArray(item.advice) ? item.advice.map((d, i) => <li key={i} className="text-indigo-700">{d}</li>) : <li className="text-indigo-700">{item.advice}</li>}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="risk">
                    <AccordionTrigger><Users className="inline mr-2 text-pink-500" />Kimler Risk Altında?</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc ml-6 space-y-1">
                        {item.risk && item.risk.map((d, i) => <li key={i} className="text-pink-700">{d}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
