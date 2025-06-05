/// FlvPlayer.tsx
'use client';
// import flvjs from 'flv.js'
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
interface FlvPlayerProps {
  className?: string | undefined;
  style?: React.CSSProperties;
  url: string;
  type?: 'flv' | 'mp4';
  isLive?: boolean;
  controls?: boolean | undefined;
  autoPlay?: boolean | undefined;
  muted?: boolean | undefined;
  height?: number | string | undefined;
  width?: number | string | undefined;
  videoProps?: React.DetailedHTMLProps<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  >;
  // flvMediaSourceOptions?: flvjs.MediaDataSource
  // flvConfig?: flvjs.Config
  flvMediaSourceOptions?: any;
  flvConfig?: any;
  onError?: (err: any) => void;
}
let flvjs: any;

const maxReloadCount = 100; //最大重连次数
let count = 0;
let lastDecodedFrames = 0;
let stuckTime = 0;

const liveOptimizeConfig = {
  //启用 IO 存储缓冲区。如果您需要实时（最小延迟）进行实时流播放，则设置为 false，但如果存在网络抖动，则可能会停止。
  enableStashBuffer: false,
  //启用分离线程进行传输复用（目前不稳定）
  // enableWorker: true,
  // 减少首帧显示等待时长
  stashInitialSize: 128, //IO暂存缓冲区初始大小
  autoCleanupSourceBuffer: true, //对SourceBuffer进行自动清理缓存
  autoCleanupMaxBackwardDuration: 60, //    当向后缓冲区持续时间超过此值（以秒为单位）时，请对SourceBuffer进行自动清理
  autoCleanupMinBackwardDuration: 40, //     指示进行自动清除时为反向缓冲区保留的持续时间（以秒为单位）。
};
let flvPlayer: any;

const FlvPlayer: React.FC<FlvPlayerProps> = (props) => {
  const {
    className,
    style,
    url,
    type = 'flv',
    isLive = true,
    controls,
    autoPlay,
    // muted = 'muted',
    // muted = true,
    height,
    width,
    videoProps,
    flvMediaSourceOptions,
    flvConfig,
    onError,
  } = props;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!url) return;
    init();
    const handleOnlineStatusChange = () => {
      if (navigator.onLine) {
        console.log('网络连接状态🎃');
        rebuild();
      }
    };

    // 监听网络连接状态变化,网络重连是，重载
    window.addEventListener('online', handleOnlineStatusChange);

    // 不暂停直播流
    if (videoRef?.current) {
      videoRef?.current?.addEventListener('pause', () => {
        console.log('暂停了，继续播放');
        videoRef.current?.play();
      });
    }
    return () => {
      if (flvPlayer) {
        // 销毁player
        flvPlayer?.pause();
        flvPlayer?.unload();
        flvPlayer?.detachMediaElement();
        flvPlayer?.destroy();
        flvPlayer = null;
      }
      if (videoRef.current) {
        // 销毁video
        videoRef.current?.pause();
        videoRef.current?.removeAttribute('src');
        //调用 load() 方法，以确保所有相关数据都被卸载。
        videoRef.current?.load();
      }
      videoRef.current?.removeEventListener('pause', () => {});
      window.removeEventListener('online', handleOnlineStatusChange);
    };
  }, [url]);

  const init = async () => {
    console.log('加载直播流--------------------------------------------------------');
    try {
      flvjs = (await import('flv.js')).default;
      if (flvjs.isSupported() && videoRef.current) {
        flvPlayer = flvjs.createPlayer(
          {
            type,
            url,
            isLive,
            ...flvMediaSourceOptions,
          },
          {
            ...flvConfig,
            ...(isLive ? liveOptimizeConfig : {}),
          },
        );
        flvPlayer.attachMediaElement(videoRef.current);
        flvPlayer.unload();
        flvPlayer.load();

        const playPromise = flvPlayer.play();

        if (playPromise !== undefined) {
          console.log(' 😈😈', playPromise);
          playPromise
            .then(() => {
              console.log('播放成功', flvPlayer);
            })
            .catch((e: any) => {
              console.log('播放失败', e);
            });
        }

        flvPlayer.on(flvjs.Events.STATISTICS_INFO, (info: any) => {
          checkStuck(info);
        });
        flvPlayer.on(flvjs.Events.RECOVERED_EARLY_EOF, (info: any) => {
          console.log('RECOVERED_EARLY_EOF', info);
        });
        // flvPlayer.on('error', err => {
        //   console.log('ERROR🤖', err)
        // })
        flvPlayer.on(flvjs.Events.ERROR, (err: any) => {
          // flvPlayer.destroy()

          console.log('flvjs.Events.ERROR👻', err);
          if (count <= maxReloadCount) {
            // 重连
            rebuild();
          } else {
            if (onError) {
              onError(err);
            }
          }
        });
      } else {
        console.error('flv.js is not support');
      }
    } catch (error) {
      console.log('trycatch😭', flvPlayer);
      console.error(error);
    }
  };

  function checkStuck(info: any) {
    const { decodedFrames } = info;
    let player = flvPlayer;
    if (!player) return;

    if (lastDecodedFrames === decodedFrames) {
      // 可能卡住了，重载
      stuckTime++;
      console.log(`stuckTime${stuckTime},${new Date()}`);

      if (stuckTime > 5) {
        console.log(`%c卡住，重建视频`, 'background:red;color:#fff', new Date());
        // 先destroy，再重建player实例
        stuckTime = 0;
        rebuild();
      }
    } else {
      lastDecodedFrames = decodedFrames;
      stuckTime = 0;
      if (player && player?.buffered?.length > 0) {
        let end = player.buffered.end(0); //获取当前buffered值(缓冲区末尾)
        let delta = end - player.currentTime; //获取buffered与当前播放位置的差值
        // 延迟过大，通过跳帧的方式更新视频
        if (delta > 10 || delta < 0) {
          console.log('延迟过大', delta);
          player.currentTime = player.buffered.end(0) - 1; //
          player.playbackRate = 1;
          return;
        }
        // 追帧
        if (delta > 1) {
          console.log('追帧', delta);
          player.playbackRate = 1.1;
        } else {
          player.playbackRate = 1;
        }
        // player.playbackRate = 1 + delta * 3
      }
    }
  }
  const rebuild = () => {
    // 可以防止内存泄漏 摧毁重载一次整个flvjsplayer实例
    try {
      count++;
      if (flvPlayer) {
        console.log('😭触发重连操作', count);
        flvPlayer?.pause();
        flvPlayer?.unload();
        flvPlayer?.detachMediaElement();
        flvPlayer?.destroy();
        flvPlayer = null;
        init();
      }
    } catch (error) {
      console.log('🤯这是rebuid的错误', error);
    }
  };

  return (
    <span className="relative">
      <video
        id="video"
        ref={videoRef}
        className={className}
        style={style}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        height={height}
        width={width}
        {...videoProps}
      />

      {/* <Image
        src={muted ? '/images/muted.png' : '/images/unmuted.png'}
        width={24}
        height={24}
        alt=""
        className=" absolute right-2 top-2"
        onClick={() => {
          setMuted(!muted);
        }}
      /> */}
    </span>
  );
};

export default FlvPlayer;

