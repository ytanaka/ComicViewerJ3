use std::{collections::HashSet, path::Path};

use fast_image_resize as fir;
use image::RgbaImage;

use crate::types::ImageSize;

pub fn is_picture_ext<P: AsRef<Path>>(p: P) -> bool {
    // 静的に保持する拡張子セット
    static EXTENSIONS: &[&str] = &[
        "AVIF", "BMP", "DDS", "EXR", "GIF", "HDR", "ICO", "JPEG", "JPG", "PNG", "PNM", "pbm",
        "pgm", "ppm", "QOI", "TGA", "TIFF", "TIF", "WebP",
    ];
    // HashSet を lazy static 的に初期化
    use std::sync::OnceLock;
    static SET: OnceLock<HashSet<String>> = OnceLock::new();
    let set = SET.get_or_init(|| {
        EXTENSIONS
            .iter()
            .copied()
            .map(|s| s.to_string().to_lowercase())
            .collect()
    });

    p.as_ref()
        .extension()
        .and_then(|s| s.to_str())
        .map(|ext| set.contains(&ext.to_lowercase()))
        .unwrap_or(false)
}

// アスペクト比を考慮して画像のサイズを計算する
pub fn calc_size(img: &RgbaImage, screen: &ImageSize) -> ImageSize {
    let width = img.width() as f64;
    let height = img.height() as f64;
    let ratio = width / height;
    let r = screen.width as f64 / screen.height as f64;

    if ratio < r {
        // 左右に余白、ターゲットの縦に合わせる
        ImageSize::new((screen.height as f64 * ratio) as u32, screen.height)
    } else {
        // 上下に余白、ターゲットの幅に合わせる
        ImageSize::new(screen.width, (screen.width as f64 / ratio) as u32)
    }
}

/// きれいな拡大縮小
pub fn resize_lanczos3(src: &RgbaImage, size: ImageSize) -> anyhow::Result<RgbaImage> {
    let src_image = fir::images::Image::from_vec_u8(
        src.width(),
        src.height(),
        src.clone().into_raw(),
        fir::PixelType::U8x4,
    )?;

    let mut dst_image = fir::images::Image::new(size.width, size.height, fir::PixelType::U8x4);

    let mut resizer = fir::Resizer::new();

    let options = fir::ResizeOptions::new()
        .resize_alg(fir::ResizeAlg::Convolution(fir::FilterType::Lanczos3));

    resizer.resize(&src_image, &mut dst_image, &options)?;

    Ok(RgbaImage::from_raw(size.width, size.height, dst_image.into_vec()).unwrap())
}

/// 画像のエッジを強調
pub fn unsharp_mask(src: &RgbaImage, sigma: f32, amount: f32) -> RgbaImage {
    // Gaussian Blur
    let blurred = image::imageops::blur(src, sigma);

    let mut output = src.clone();

    for ((dst, original), blur) in output.pixels_mut().zip(src.pixels()).zip(blurred.pixels()) {
        for c in 0..3 {
            let value = original[c] as f32 + amount * (original[c] as f32 - blur[c] as f32);

            dst[c] = value.clamp(0.0, 255.0) as u8;
        }

        // Alpha は変更しない
        dst[3] = original[3];
    }

    output
}
