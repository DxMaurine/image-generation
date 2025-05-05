const promptInput = document.getElementById("prompt");
const generateBtn = document.getElementById("generateBtn");
const generatedImage = document.getElementById("generatedImage");
const downloadBtn = document.getElementById("downloadBtn");
const saveBtn = document.getElementById("saveBtn");
const loadingModal = document.getElementById("loadingModal");

const resolutionPreset = document.getElementById("resolutionPreset");
const widthInput = document.getElementById("width");
const heightInput = document.getElementById("height");
const artstyleSelect = document.getElementById("artstyle");

let currentImage = null;

// Sync preset dropdown to width/height input
resolutionPreset.addEventListener("change", () => {
  const [w, h] = resolutionPreset.value.split("x").map(Number);
  widthInput.value = w;
  heightInput.value = h;
});

async function generateImage() {
  const promptRaw = promptInput.value.trim();
  const style = artstyleSelect.value.trim();

  if (!promptRaw) {
    alert("Please enter a prompt.");
    return;
  }

  const prompt = style ? `${promptRaw}, ${style}` : promptRaw;
  const width = widthInput.value || 512;
  const height = heightInput.value || 512;

  const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=${width}&height=${height}`;

  loadingModal.classList.add("active");

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Image generation failed.");

    const contentType = response.headers.get("content-type");
    if (!contentType.startsWith("image/")) {
      const errorText = await response.text();
      throw new Error(`Unexpected response: ${errorText}`);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    generatedImage.src = imageUrl;
    currentImage = {
      url: imageUrl,
      blob,
      prompt,
      timestamp: new Date().toISOString(),
    };

    downloadBtn.disabled = false;
    saveBtn.disabled = false;
  } catch (error) {
    alert("Gagal menghasilkan gambar: " + error.message);
    console.error(error);
  } finally {
    loadingModal.classList.remove("active");
  }
}

generateBtn.addEventListener("click", generateImage);
