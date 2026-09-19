use std::{collections::HashSet, path::Path};

use fast_image_resize as fir;
use image::{ImageReader, RgbaImage};

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

// 画像のサイズ取得
pub fn get_img_size(path: impl AsRef<Path>) -> anyhow::Result<ImageSize> {
    let reader = ImageReader::open(path)?;
    let dim = reader.into_dimensions()?;
    Ok(ImageSize::new(dim.0, dim.1))
}

// アスペクト比を考慮して画像のサイズを計算する
pub fn calc_resize(src: &ImageSize, target: &ImageSize, limit_ratio: u32) -> ImageSize {
    let width = src.width as f64;
    let height = src.height as f64;
    let ratio = width / height;
    let r = target.width as f64 / target.height as f64;

    let mut ret = if ratio < r {
        // 左右に余白、ターゲットの縦に合わせる
        ImageSize::new((target.height as f64 * ratio) as u32, target.height)
    } else {
        // 上下に余白、ターゲットの幅に合わせる
        ImageSize::new(target.width, (target.width as f64 / ratio) as u32)
    };

    // 元画像のx倍までに制限する
    if src.width * limit_ratio < ret.width || src.height * limit_ratio < ret.height {
        ret.width = src.width * limit_ratio;
        ret.height = src.height * limit_ratio;
    }
    ret
}

/// きれいな拡大縮小
pub fn resize_lanczos3(src: &RgbaImage, size: &ImageSize) -> anyhow::Result<RgbaImage> {
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
