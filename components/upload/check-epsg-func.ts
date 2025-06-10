
import { fromBlob } from "geotiff";


export function getGeoTIFFCRSCode(file: File): Promise<string> {
    return new Promise(async (resolve) => {
      try {
        // 增加TIFF头验证逻辑
        const validateTIFFHeader = (buffer: ArrayBuffer) => {
          const view = new DataView(buffer);
          if (view.byteLength < 4) {
            // 增加缓冲区长度检查
            throw new Error("Invalid TIFF header length");
          }
          const magicNumber = view.getUint16(0, false);
          if (magicNumber !== 0x4d4d && magicNumber !== 0x4949) {
            throw new Error("Invalid TIFF header identifier");
          }
        };
  
        // 扩展头部读取范围到8MB（某些大TIFF需要更大偏移）
        const HEADER_SIZE = 1024 * 1024 * 8; // 增加到8MB
        const headerBlob = file.slice(0, HEADER_SIZE);
        const headerBuffer = await headerBlob.arrayBuffer();
  
        validateTIFFHeader(headerBuffer);
  
        // 读取headerBuffer里面的GeoTIFF文件头部信息，取得EPSG编码
        const tiff = await fromBlob(file);
        const image = await tiff.getImage(); // 获取第一个图像（多图像需遍历）
        // 获取元数据
        const metadata = image.getFileDirectory();
        const geoKeys = metadata.GeoKeyDirectory;
  
        // 处理Uint16Array类型
        if (geoKeys instanceof Uint16Array || Array.isArray(geoKeys)) {
          // console.log('GeoKeyDirectory:', geoKeys);
  
          // 转换TypedArray为二维数组
          const entries = [];
          for (let i = 0; i < geoKeys.length; i += 4) {
            entries.push([
              geoKeys[i], // key
              geoKeys[i + 1], // location
              geoKeys[i + 2], // count
              geoKeys[i + 3], // value_offset
            ]);
          }
  
          const projectedKey = entries.find(([key]) => key === 3072);
          const geographicKey = entries.find(([key]) => key === 2048);
  
          const epsgCode = projectedKey ? projectedKey[3] : geographicKey?.[3];
  
          if (epsgCode) {
            const epsg = `EPSG:${epsgCode}`;
            console.log("CRS Code:", epsg);
            resolve(epsg);
            return;
          }
        }
  
        console.log("CRS Code: empty", geoKeys, Array.isArray(geoKeys));
        resolve("empty");
      } catch (error) {
        console.error("文件读取失败:", error);
        resolve("empty");
      }
    });
}
