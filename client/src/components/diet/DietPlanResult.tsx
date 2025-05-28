import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import jsPDF from "jspdf";

export default function DietPlanResult({ initialPlan }: { initialPlan: string }) {
  const [dietPlan, setDietPlan] = useState(initialPlan);

  // PDF olarak indir
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(dietPlan, 180);
    doc.text(lines, 10, 10);
    doc.save("diyet-plani.pdf");
  };

  // Word olarak indir
  const handleDownloadWord = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: dietPlan.split('\n').map(line =>
            new Paragraph({
              children: [new TextRun(line)],
            })
          ),
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "diyet-plani.docx");
  };

  return (
    <div className="p-6 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Oluşturulan Diyet Planı</h2>
      <textarea
        className="w-full min-h-[300px] border rounded p-2 font-mono"
        value={dietPlan}
        onChange={e => setDietPlan(e.target.value)}
      />
      <div className="flex gap-2 mt-4">
        <Button onClick={handleDownloadPDF}>PDF Olarak İndir</Button>
        <Button onClick={handleDownloadWord}>Word Olarak İndir</Button>
      </div>
    </div>
  );
} 