import { ImageSize } from '@/lib/bindings';
import { zoomLevel2ZoomRatio } from '@/lib/tools/image-zoom';

export type ImageViewHelperParam = {
  imageSize0: ImageSize;
  imageSize1: ImageSize;
  dualView: boolean;
  zoomLevel: number;
  divSize: ImageSize | null;
};

const imageDefaultSize = [
  {
    width: 0,
    height: 0,
  },
  {
    width: 0,
    height: 0,
  },
];

// <img> に指定する画像サイズを取得
// return [メイン画像サイズ, dualView の時の２つ目の画像サイズ]
//   表示対象画像がない場合は、width = height = 0
export function getImageWH(param: ImageViewHelperParam): ImageSize[] {
  const { imageSize0, imageSize1, dualView, divSize } = param;

  // 画像表示の準備が整っていない
  if (!divSize || !imageSize0) return imageDefaultSize;

  // １枚だけ表示
  if (!dualView || !imageSize1) {
    return getImageWH1(param);
  }

  // ２枚表示
  return getImageWH2(param);
}
function getImageWH1(param: ImageViewHelperParam) {
  const { imageSize0, zoomLevel, divSize } = param;
  const uiZoom = zoomLevel2ZoomRatio(zoomLevel);

  // 画像のサイズ
  const imgWidth = imageSize0.width;
  const imgHeight = imageSize0.height;
  if (!imgWidth || !imgHeight) return imageDefaultSize;
  const imgRatio = imgWidth / imgHeight;

  // 表示領域のサイズ
  const viewHeight = divSize?.height;
  const viewWidth = divSize?.width;
  if (!viewHeight || !viewWidth) return imageDefaultSize;
  const viewRatio = viewWidth / viewHeight;

  if (imgRatio < viewRatio) {
    // 画面のほうが横長なら、上下ぴったり、左右に余白 => その後 zoom
    const imageZoom = viewHeight / imgHeight;
    return [
      {
        width: imgWidth * imageZoom * uiZoom,
        height: viewHeight * uiZoom,
      },
      {
        width: 0,
        height: 0,
      },
    ];
  } else {
    // 画像のほうが横長なら、左右ぴったり、上下に余白 => その後 zoom
    const imageZoom = viewWidth / imgWidth;
    return [
      {
        width: viewWidth * uiZoom,
        height: imgHeight * imageZoom * uiZoom,
      },
      {
        width: 0,
        height: 0,
      },
    ];
  }
}

function getImageWH2(param: ImageViewHelperParam) {
  const { imageSize0, imageSize1, zoomLevel, divSize } = param;
  const uiZoom = zoomLevel2ZoomRatio(zoomLevel);

  // 画像のサイズ
  const w1 = imageSize0.width;
  const h1 = imageSize0.height;
  const w2 = imageSize1.width;
  const h2 = imageSize1.height;
  const imgWidth = w1 + w2;
  const imgHeight = Math.max(h1, h2);
  const imgRatio = imgWidth / imgHeight;

  // 表示領域のサイズ
  const viewHeight = divSize?.height;
  const viewWidth = divSize?.width;
  if (!viewHeight || !viewWidth) return imageDefaultSize;
  const viewRatio = viewWidth / viewHeight;

  let height;
  let width;
  if (imgRatio < viewRatio) {
    // 左右に余白
    height = viewHeight;
    width = (viewHeight / imgHeight) * imgWidth;
  } else {
    // 上下に余白
    height = (viewWidth / imgWidth) * imgHeight;
    width = viewWidth;
  }

  const width1 = width * (w1 / (w1 + w2));
  const width2 = width * (w2 / (w1 + w2));

  let height1 = height;
  let height2 = height;
  if (h1 < h2) height1 = height * (h1 / h2);
  if (h1 > h2) height2 = height * (h2 / h1);

  // console.log("wh1:", w1, h1, " wh2:", w2, h2, " v:", viewWidth, viewHeight);

  return [
    {
      width: width1 * uiZoom,
      height: height1 * uiZoom,
    },
    {
      width: width2 * uiZoom,
      height: height2 * uiZoom,
    },
  ];
}
