/**
 * Cloudflare Workers 静态资源 + Range 请求支持
 *
 * Workers 静态资源模式默认不支持 HTTP Range 请求（返回 200 而非 206），
 * 导致移动端视频播放器无法流式加载视频。
 * 本 Worker 拦截视频请求，手动处理 Range，返回 206 Partial Content。
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 仅拦截视频文件请求
    const isVideo = /\.(mp4|webm|ogg|mov|m4v)$/i.test(path);

    // 非视频请求 → 交给默认静态资源处理
    if (!isVideo) {
      return env.ASSETS.fetch(request);
    }

    // 视频请求 → 通过 ASSETS 绑定获取，手动处理 Range
    const assetResponse = await env.ASSETS.fetch(request);
    if (!assetResponse.ok) {
      return assetResponse;
    }

    const range = request.headers.get('Range');

    // 无 Range 请求 → 返回完整内容，补上 Accept-Ranges
    if (!range) {
      const headers = new Headers(assetResponse.headers);
      headers.set('Accept-Ranges', 'bytes');
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        headers
      });
    }

    // 解析 Range: bytes=start-end
    const match = range.match(/bytes=(\d+)-(\d+)?/);
    if (!match) {
      return new Response('Invalid Range', { status: 416 });
    }

    const start = parseInt(match[1], 10);
    const fullBody = await assetResponse.arrayBuffer();
    const totalSize = fullBody.byteLength;
    const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;

    if (start >= totalSize) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${totalSize}` }
      });
    }

    const chunkSize = end - start + 1;
    const chunk = fullBody.slice(start, end + 1);

    const headers = new Headers(assetResponse.headers);
    headers.set('Content-Range', `bytes ${start}-${end}/${totalSize}`);
    headers.set('Content-Length', chunkSize);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');

    return new Response(chunk, {
      status: 206,
      headers
    });
  }
};
