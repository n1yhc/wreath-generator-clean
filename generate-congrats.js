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

  // ✅ DOMContentLoaded 내부에서 이미지 로딩
  const frameImg = new Image();
  frameImg.src = 'asset/congrats-frame.png';

  frameImg.onload = () => {
    canvas.width = frameImg.naturalWidth;
    canvas.height = frameImg.naturalHeight;
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
    ctx.drawImage(frameImg, 0, 0);

    if (uploadedImg) {
      const imgX = canvas.width / 2 - 110;
      const imgY = 0;
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
      ctx.translate(240, 300);
      ctx.rotate(13.8 * Math.PI / 180);
      ctx.scale(0.85, 1);
      ctx.font = 'bold 55px ChosunGs, serif';
      drawVerticalText(ctx, leftText);
      ctx.resetTransform();
    }

    const rightText = rightInput.value;
    if (rightText) {
      ctx.translate(canvas.width - 240, 300);
      ctx.rotate(-14 * Math.PI / 180);
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

  function downloadImage() {
    const link = document.createElement('a');
    link.download = 'wreath.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function uploadToSupabase() {
    const canvasDataUrl = canvas.toDataURL('image/png');
    const res = await fetch(canvasDataUrl);
    const blob = await res.blob();
    const fileName = `wreath_${Date.now()}.png`;

    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(fileName, blob);

    if (error) {
      alert('🔥 Supabase 업로드 실패!');
      console.error(error);
      return;
    }

    const { data: urlData } = supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    alert('✅ 화환이 업로드되었습니다!\n');
  }
});
