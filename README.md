# Image FX Transitions to Video

Image FX Transitions to Video 是一个前端项目，旨在为图片添加动态特效和转场效果，并将其导出为视频。该项目基于现代 Web 技术栈构建，利用 WebGL 和 GL Transition 实现高性能的图像处理，通过 Remotion 实现视频导出功能，适用于需要在 Web 环境中处理图像和视频特效的场景。可在此项目基础上进行各种魔改及二次封装

## 技术栈

-   **WebGL:** 用于在浏览器中进行 3D 绘图和图像处理。
-   **GL Transition:** 利用 WebGL 实现的图像转场效果库。
-   **Remotion:** 一个 React 框架，用于在浏览器中制作视频。
-   **React:** 用于构建用户界面的 JavaScript 库。
-   **Node.js:** 服务器端的 JavaScript 运行环境。

## 核心功能

-   **图片特效:** 支持多种图片特效，如缩放、闪白、抖动、灵魂出窍、数字失真等。
-   **转场效果:** 提供流畅的转场效果，使图片切换更加自然。
-   **视频导出:** 将添加特效和转场效果的图片序列导出为视频文件。

## 快速开始

1.  克隆仓库：

    ```bashCopy code
    git clone https://github.com/XindongG/image-fx-transitions-to-video.git
    ```

1.  安装依赖：

    ```bashCopy code
    cd image-fx-transitions-to-video
    npm install
    ```

1.  运行示例：

    ```bashCopy code
    npm start
    ```
 访问 `http://localhost:3000` 查看效果。


## 技术实现

### 图片特效

使用 WebGL 和自定义着色器（Shader）来实现不同的图片特效。通过调整着色器中的参数，可以实现各种动态效果，如缩放、闪白等。

### 转场效果

利用 GL Transition 库提供的转场效果，结合 WebGL 实现流畅的图片切换。转场效果的实现同样基于着色器，通过控制过渡的进度和样式来实现不同的效果。

### 视频导出

通过 Remotion 框架，将添加了特效和转场的图片序列渲染为视频。Remotion 提供了基于 React 的视频制作工具，可以轻松地将图片序列和动画转换为视频格式。

