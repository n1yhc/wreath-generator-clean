// Supabase 연결
const supabaseClient = supabase.createClient(
  'https://hecdtiykzzucvrnvomij.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlY2R0aXlrenp1Y3ZybnZvbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNzAyMDksImV4cCI6MjA2NDk0NjIwOX0.5GzBjJ7gbEMR96wqVRIN3n81FSy9mdbdQetJrsx2xIQ'
);

const bucketName = 'wreath';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('custom-wreath-canvas');
  const ctx = canvas.getContext('2d');
  const leftInput = document.getElementById('ribbon-left');
  const rightInput = document.getElementById('ribbon-right');
  const imageUpload = document.getElementById('image-upload');
  const generateBtn = document.getElementById('generate-button');
  const downloadBtn = document.getElementById('download-button');

  let uploadedImg = null;
  let frameImg = new Image();
  frameImg.src = 'asset/condolence-frame.png';

  frameImg.onload = () => {
    const scale = 1.2;
    canvas.width = frameImg.naturalWidth * scale;
    canvas.height = frameImg.naturalHeight * scale;
    drawCanvas();
  };

  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      uploadedImg = new Image();
      uploadedImg.onload = () => {
        drawCanvas();
      };
      uploadedImg.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  leftInput.addEventListener('input', drawCanvas);
  rightInput.addEventListener('input', drawCanvas);
  generateBtn.addEventListener('click', uploadToSupabase);
  downloadBtn.addEventListener('click', downloadImage);

  function drawCanvas() {
    if (!frameImg.complete) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

    if (uploadedImg) {
      const imgX = canvas.width / 2 - 115;
      const imgY = 80 - 70;
      const imgW = 220;
      const imgH = 220;

      ctx.save();
      ctx.beginPath();
      ctx.arc(imgX + imgW / 2, imgY + imgH / 2, imgW / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(uploadedImg, imgX, imgY, imgW, imgH);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';

    const leftText = leftInput.value;
    if (leftText) {
      ctx.translate(230, 300);
      ctx.rotate(12.5 * Math.PI / 180);
      ctx.scale(0.85, 1);
      ctx.font = 'bold 55px ChosunGs, serif';
      drawVerticalText(ctx, leftText);
      ctx.resetTransform();
    }

    const rightText = rightInput.value;
    if (rightText) {
      ctx.translate(canvas.width - 230, 300);
      ctx.rotate(-11.8 * Math.PI / 180);
      ctx.scale(0.85, 1);
      ctx.font = 'bold 55px ChosunGs, serif';
      drawVerticalText(ctx, rightText);
      ctx.resetTransform();
    }

    ctx.restore();
  }

  function drawVerticalText(ctx, text) {
    const words = text.split(' ');
    let y = 0;
    for (let word of words) {
      for (let char of word) {
        ctx.fillText(char, 0, y);
        y += 55;
      }
      y += 14;
    }
  }

  async function downloadImage() {
    const link = document.createElement('a');
    link.download = 'wreath.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    
 // 🆕 다운로드 기록 저장
 await supabaseClient
 .from('wreath_download_log')
 .insert({})
 .then(({ error }) => {
   if (error) {
     console.error('다운로드 기록 실패:', error);
   } else {
     console.log('다운로드 기록 완료!');
   }
 });
    
  }

  async function uploadToSupabase() {
    const canvasDataUrl = canvas.toDataURL('image/png');
    const res = await fetch(canvasDataUrl);
    const blob = await res.blob();
    const fileName = `wreath_${Date.now()}.png`;

    // 1. 업로드
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(fileName, blob);

    if (error) {
      alert('🔥 Supabase 업로드 실패!');
      console.error(error);
      return;
    }

    // 2. DB 기록
    const insertResult = await supabaseClient
      .from("wreaths")
      .insert([
        {
          filename: fileName,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertResult.error) {
      alert('⚠️ DB 저장 실패!');
      console.error(insertResult.error);
      return;
    }

    // 🆕 wreath_log 테이블에 insert (누적 카운트용)
await supabaseClient
.from('wreath_log')
.insert({})
.then(({ error }) => {
  if (error) {
    console.error('화환 카운트 insert 실패:', error);
  } else {
    console.log('화환 카운트 기록 완료!');
  }
});


    // 3. 오래된 항목 1개 삭제
    const { data: extra, error: extraError } = await supabaseClient
      .from("wreaths")
      .select("*")
      .order("created_at", { ascending: true })
      .range(100, 100);

    if (extra && extra.length > 0) {
      const oldItem = extra[0];

      await supabaseClient
        .storage
        .from(bucketName)
        .remove([oldItem.filename]);

      await supabaseClient
        .from("wreaths")
        .delete()
        .eq("id", oldItem.id);
    }

    const { data: urlData } = supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    alert('화환이 업로드되었습니다! look around wreaths 페이지에서 최신 100개 화환을 둘러보세요.\n');
  }
});
