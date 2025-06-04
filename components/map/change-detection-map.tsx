'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WMTS from 'ol/source/WMTS';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { get as getProjection, transformExtent } from 'ol/proj';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { getTopLeft, getWidth } from 'ol/extent';
import { Style, Fill, Stroke } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import { Size } from 'ol/size';

interface MapImageData {
  id: number;
  flag_info: 'before' | 'after';
  store_name: string;
  layer: string;
  url: string;
  center_lat: number;
  center_lon: number;
  extent: [number, number, number, number];
  json_file_path: string;
}

interface ChangeDetectionMapProps {
  beforeImage?: MapImageData;
  afterImage?: MapImageData;
  geoJsonUrl?: string;
}

const ChangeDetectionMap: React.FC<ChangeDetectionMapProps> = ({ beforeImage, afterImage, geoJsonUrl }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null); // Renamed mapRef to mapContainerRef for clarity
  const mapInstance = useRef<Map | null>(null);
  const beforeLayerRef = useRef<TileLayer<WMTS> | null>(null);
  const afterLayerRef = useRef<TileLayer<WMTS> | null>(null);
  const geoJsonLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const tiandituKey = '7fe24454dfe4a72ff3f65a0f6ca165ac'; // 天地图密钥
  const matrixSet = 'c';
  const projection = getProjection('EPSG:4326');
  const projectionExtent = projection?.getExtent();

  // 生成分辨率和矩阵ID
  const generateResolutionsAndMatrixIds = (type: string, zoomLevels: number) => {
    if (!projectionExtent) return { resolutions: [], matrixIds: [] };
    const size = getWidth(projectionExtent) / 256;
    let resolutions = [];
    let matrixIds = [];

    switch (type) {
      case 'baseTile':
        for (let z = 0; z <= zoomLevels; ++z) {
          resolutions.push(size / Math.pow(2, z));
          matrixIds.push(`${z}`);
        }
        break;
      case 'geoServerTile':
        for (let z = 0; z <= zoomLevels; ++z) {
          resolutions.push(size / Math.pow(2, z));
          matrixIds.push(`EPSG:4326:${z}`);
        }
        resolutions.splice(0, 1);
        break;
    }

    return { resolutions, matrixIds };
  };

  // 创建WMTS瓦片网格
  const createWmtsTileGrid = (type: string) => {
    if (!projectionExtent) return undefined;
    const { resolutions, matrixIds } = generateResolutionsAndMatrixIds(type, 22);
    return new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds,
    });
  };

  // 加载天地图底图图层
  const loadBaseLayers = () => {
    const baseMap2DUrls = [
      {
        url: `http://t{0-6}.tianditu.gov.cn/img_${matrixSet}/wmts?tk=${tiandituKey}`,
        layer: 'img',
        matrixSet: matrixSet,
        format: 'tiles',
        projection: projection,
        wrapX: true,
        type: 'WMTS',
        style: 'default',
        zIndex: 1000,
      },
      {
        url: `http://t4.tianditu.gov.cn/cia_${matrixSet}/wmts?tk=${tiandituKey}`,
        layer: 'cia',
        matrixSet: matrixSet,
        format: 'tiles',
        projection: projection,
        wrapX: true,
        type: 'WMTS',
        style: 'default',
        zIndex: 1001,
      },
    ];

    return baseMap2DUrls.map((config, index) => {
      const source = new WMTS({
        url: config.url,
        layer: config.layer,
        matrixSet: config.matrixSet,
        format: config.format,
        projection: config.projection!,
        tileGrid: createWmtsTileGrid('baseTile')!,
        style: config.style,
        wrapX: config.wrapX,
      });

      return new TileLayer({
        source: source,
        zIndex: config.zIndex,
      });
    });
  };

  // 创建GeoServer图层
  const createGeoServerLayer = (imageData: MapImageData, zIndex: number) => {
    const source = new WMTS({
      url: imageData.url,
      layer: imageData.layer,
      matrixSet: 'EPSG:4326',
      format: 'image/png',
      projection: projection!,
      tileGrid: createWmtsTileGrid('geoServerTile')!,
      style: '',
      wrapX: true,
    });

    return new TileLayer({
      source: source,
      zIndex: zIndex,
    });
  };

  // 加载GeoJSON图层
  const loadGeoJsonLayer = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const geoJsonData = await response.json();

      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(geoJsonData, {
          featureProjection: 'EPSG:4326',
        }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) => {
          const properties = feature.getProperties();
          const classValue = properties.class || 'default';
          
          // 根据class字段设置不同颜色
          const colorMap: { [key: string]: string } = {
            '1': '#ff0000', // 红色
            '2': '#00ff00', // 绿色
            '3': '#0000ff', // 蓝色
            '4': '#ffff00', // 黄色
            '5': '#ff00ff', // 紫色
            'default': '#ff0000', // 默认红色
          };
          
          const color = colorMap[classValue.toString()] || colorMap['default'];
          
          return new Style({
            stroke: new Stroke({
              color: color,
              width: 2,
            }),
            fill: new Fill({
              color: color + '40', // 添加透明度
            }),
          });
        },
        zIndex: 10088,
      });

      return vectorLayer;
    } catch (error) {
      console.error('Failed to load GeoJSON:', error);
      return null;
    }
  };

  // 更新图层渲染范围
  const updateMapView = useCallback(() => {
    if (!mapInstance.current || !beforeLayerRef.current || !afterLayerRef.current || !mapContainerRef.current || !dividerRef.current) return;

    const map = mapInstance.current;
    const mapElement = mapContainerRef.current;
    const dividerElement = dividerRef.current;

    const mapRect = mapElement.getBoundingClientRect();
    // 获取分割线当前的left值 (百分比或像素)
    const dividerStyleLeft = dividerElement.style.left;
    let dividerX: number;
    if (dividerStyleLeft.endsWith('%')) {
        dividerX = (parseFloat(dividerStyleLeft) / 100) * mapRect.width;
    } else {
        dividerX = parseFloat(dividerStyleLeft); // 假设已经是相对于mapElement的像素值
    }
    
    // 确保 dividerX 是相对于 mapRect.left 的偏移量
    // 如果 dividerElement.style.left 是 '50px' 这样的绝对值，并且是直接相对于 mapContainerRef 的，那么 dividerX 就是这个值
    // 如果 dividerElement.style.left 是 '50%'，那么它就是相对于 mapContainerRef 宽度的百分比

    const mapExtent = map.getView().calculateExtent(map.getSize()!);
    const mapWidthInGeoCoords = getWidth(mapExtent);
    const mapPixelWidth = map.getSize()![0];

    // 计算分割线在地理坐标系中的X值
    const dividerGeoX = mapExtent[0] + (dividerX / mapPixelWidth) * mapWidthInGeoCoords;

    // 更新前时相图层的范围 (显示分割线左侧)
    const beforeExtent = [...mapExtent];
    beforeExtent[2] = dividerGeoX; // 右边界
    beforeLayerRef.current.setExtent(beforeExtent);

    // 更新后时相图层的范围 (显示分割线右侧)
    const afterExtent = [...mapExtent];
    afterExtent[0] = dividerGeoX; // 左边界
    afterLayerRef.current.setExtent(afterExtent);

    // GeoJSON图层通常不需要根据卷帘分割，保持全图显示
    if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.setExtent(mapExtent); // 或者不设置extent，让其默认显示全部
    }

    map.render(); // 重新渲染地图以应用范围更改
  }, []);


  // 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current || !beforeImage || !afterImage || !projection) return;

    const baseLayers = loadBaseLayers();

    const newBeforeLayer = createGeoServerLayer(beforeImage, 10086);
    beforeLayerRef.current = newBeforeLayer;

    const newAfterLayer = createGeoServerLayer(afterImage, 10087);
    afterLayerRef.current = newAfterLayer;

    const map = new Map({
      target: mapContainerRef.current,
      layers: [...baseLayers, newBeforeLayer, newAfterLayer,],
      controls: defaultControls({
        zoom: false,
        rotate: false,
        attribution: false,
      }),
      view: new View({
        projection: projection,
        zoom: 12, // Initial zoom, will be adjusted by fit
      }),
    });
    mapInstance.current = map;

    const extentToFit = afterImage.extent; // Or combine extents if necessary
    const transformedExtent = transformExtent(extentToFit, 'EPSG:4326', 'EPSG:4326');
    map.getView().fit(transformedExtent, {
      size: map.getSize()!,
      padding: [10, 10, 10, 10] // Optional padding
    });

    // 监听地图视图变化事件，确保在地图移动、缩放时也更新图层范围
    const view = map.getView();
    const onViewChange = () => {
      updateMapView();
    };
    
    view.on('change:center', onViewChange);
    view.on('change:resolution', onViewChange);

    if (geoJsonUrl) {
      loadGeoJsonLayer(geoJsonUrl).then((geoJsonLayer) => {
        if (geoJsonLayer) {
          geoJsonLayerRef.current = geoJsonLayer;
          map.addLayer(geoJsonLayer);
        }
        // Initial view update after all layers are potentially added
        if (dividerRef.current && mapContainerRef.current) {
            const mapRect = mapContainerRef.current.getBoundingClientRect();
            const initialDividerX = mapRect.width / 2;
            dividerRef.current.style.left = `${initialDividerX}px`;
            updateMapView();
        }
      });
    } else {
        // Initial view update if no GeoJSON
        if (dividerRef.current && mapContainerRef.current) {
            const mapRect = mapContainerRef.current.getBoundingClientRect();
            const initialDividerX = mapRect.width / 2;
            dividerRef.current.style.left = `${initialDividerX}px`;
            updateMapView();
        }
    }

    return () => {
      view.un('change:center', onViewChange);
      view.un('change:resolution', onViewChange);
      map.setTarget(undefined);
    };
  }, [beforeImage, afterImage, geoJsonUrl, projection, updateMapView]); // Added updateMapView to dependencies

  // 处理鼠标按下、移动和松开事件 for the divider
  useEffect(() => {
    const mapElement = mapContainerRef.current;
    const divider = dividerRef.current;

    if (!mapElement || !divider || !beforeImage || !afterImage) return;

    let isDragging = false;
    let animationFrameId: number;

    const onMouseDown = (evt: MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      isDragging = true;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    };

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!isDragging) return;

      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const mapRect = mapElement.getBoundingClientRect();
        const clientX = moveEvt.clientX - mapRect.left;
        // Ensure divider stays within map bounds
        const min = 0; // Allow divider to go to the very edge
        const max = mapRect.width;
        let offsetX = clientX < min ? min : clientX > max ? max : clientX;
        
        divider.style.left = `${offsetX}px`;
        updateMapView();
      });
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      cancelAnimationFrame(animationFrameId);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    divider.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Set initial position of the divider and update view
    const mapRect = mapElement.getBoundingClientRect();
    const initialDividerX = mapRect.width / 2;
    divider.style.left = `${initialDividerX}px`;
    updateMapView();

    return () => {
      divider.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrameId);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [beforeImage, afterImage, updateMapView]); // updateMapView is a dependency

  const formatStoreName = (name?: string) => {
    if (!name) return '';
    
    // 匹配 yyyymmddhhmmssfff 格式的时间戳（总长度17位）
    const timestampRegex = /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([01][0-9]|2[0-3])([0-5][0-9]){2}\d{3}/;
    const match = name.match(timestampRegex);
    
    // 如果匹配到时间戳则截断，否则使用原字符串
    let processed = match && match[0].length === 17 ? name.slice(17) : name;
    
    // 截断处理（保留前20个字符）
    const maxLength = 20;
    return processed.length > maxLength 
      ? `${processed.substring(0, maxLength)}...`
      : processed;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* 可拖拽的分割线 */}
      {beforeImage && afterImage && (
        <div
          ref={dividerRef}
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10 flex items-center justify-center"
          style={{ left: `50%`, transform: 'translateX(-50%)' }} // Initial position, will be updated by useEffect
        >
          <div className="w-6 h-12 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* 左侧标签 - 后时相 */}
      <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-lg shadow-lg text-sm font-medium z-10">
        {formatStoreName(beforeImage?.store_name)}
      </div>
      
      {/* 右侧标签 - 前时相 */}
      <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-lg shadow-lg text-sm font-medium z-10">
      {formatStoreName(afterImage?.store_name)}
      </div>
      
      {/* 底部说明 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-lg">
        <div className="text-xs text-gray-500 text-center">
          拖动中间分割线进行卷帘对比
        </div>
      </div>
    </div>
  );
};

export default ChangeDetectionMap;
 