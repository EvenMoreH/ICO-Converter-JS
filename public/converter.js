import { encodeIco } from "https://esm.sh/icojs";

const fileInput = document.getElementById("file");
const imgPreview = document.getElementById("preview");
const downloadBtn = document.getElementById("download");

let outputBlob = null;
let previewUrl = null;

async function canvasToPngBlob(canvas) {
    return await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Failed to create PNG blob."));
                return;
            }
            resolve(blob);
        }, "image/png");
    });
}

async function buildIcoFromBitmap(bitmap) {
    const sizes = [16, 32, 48, 64, 128, 256].filter(
        (size) => size <= Math.max(bitmap.width, bitmap.height),
    );
    const iconList = [];

    for (const size of sizes) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");
        context.clearRect(0, 0, size, size);

        const scale = Math.min(size / bitmap.width, size / bitmap.height);
        const drawWidth = Math.round(bitmap.width * scale);
        const drawHeight = Math.round(bitmap.height * scale);
        const dx = Math.floor((size - drawWidth) / 2);
        const dy = Math.floor((size - drawHeight) / 2);

        context.drawImage(bitmap, dx, dy, drawWidth, drawHeight);

        const pngBlob = await canvasToPngBlob(canvas);
        const buffer = await pngBlob.arrayBuffer();
        iconList.push({ buffer });
    }

    const icoBuffer = await encodeIco(iconList);
    return new Blob([icoBuffer], { type: "image/x-icon" });
}

fileInput.addEventListener("change", async () => {
    const selectedFile = fileInput.files?.[0];
    if (!selectedFile) {
        return;
    }

    const bitmap = await createImageBitmap(selectedFile);

    outputBlob = await buildIcoFromBitmap(bitmap);

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
    previewUrl = URL.createObjectURL(outputBlob);
    imgPreview.src = previewUrl;
    downloadBtn.disabled = false;
});

downloadBtn.addEventListener("click", () => {
    if (!outputBlob) {
        return;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");

    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted-${timestamp}.ico`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});
