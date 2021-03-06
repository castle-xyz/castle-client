//
//  DrawDataFrame.cpp
//  liblove-ios
//
//  Created by Jesse Ruder on 1/29/21.
//

#include "DrawDataFrame.hpp"
#include "DrawData.hpp"
#include "DrawAlgorithms.hpp"
#include "image/Image.h"
#include "data/DataModule.h"
#include "filesystem/Filesystem.h"

#define DEBUG_FILL_IMAGE_SIZE false

namespace love {
namespace ghost {


  void DrawDataFrame::deserializePathDataList() {
    /*auto newPathDataList = [];
    for (size_t i = 0; i < pathDataList.size(); i++) {
          auto pathData = pathDataList[i];
          if (pathData.points.size() > 2) {
            auto pathData = util.deepCopyTable(pathData);
            pathData.subpathDataList = null;
            pathData.tovePath = null;
            for (size_t j = 1; j < pathData.points.size() - 1; j++) {
                  auto newPathData = util.deepCopyTable(pathData);
                  newPathData.points = util.deepCopyTable(Point(pathData.points[j],
    pathData.points[j + 1])); newPathDataList.push_back(newPathData);
            }
          } else {
            newPathDataList.push_back(pathData);
          }
    }
    pathDataList = newPathDataList;*/
  }

  void DrawDataFrame::deserializeFillAndPreview() {
    if (fillPng && fillPng->length() > 0) {
      // data::ContainerType ctype = data::CONTAINER_STRING;
      data::EncodeFormat format = data::ENCODE_BASE64;

      size_t fileDataStringLen = 0;
      char *fileDataString = nullptr;
      fileDataString = data::decode(format, fillPng->c_str(), fillPng->length(), fileDataStringLen);

      data::DataModule *dataModule = Module::getInstance<data::DataModule>(Module::M_DATA);
      auto byteData = std::unique_ptr<data::ByteData>(
          dataModule->newByteData(fileDataString, fileDataStringLen, true));

      image::Image *imageModule = Module::getInstance<image::Image>(Module::M_IMAGE);
      fillImageData = std::unique_ptr<image::ImageData>(imageModule->newImageData(byteData.get()));
    }

    // base64Png = renderPreviewPng();
  }

  bool DrawDataFrame::arePathDatasMergable(PathData pd1, PathData pd2) {
    if (!DrawAlgorithms::coordinatesEqual(pd1.points[pd1.points.size() - 1], pd2.points[0])) {
      return false;
    }
    if (pd1.style != pd2.style) {
      return false;
    }
    if (!DrawAlgorithms::optionalCoordinatesEqual(pd1.bendPoint, pd2.bendPoint)) {
      return false;
    }
    if (pd1.isFreehand != pd2.isFreehand) {
      return false;
    }
    if (!DrawAlgorithms::colorsEqual(pd1.color, pd2.color)) {
      return false;
    }
    return true;
  }

  float DrawDataFrame::round(float num, int numDecimalPlaces) {
    auto mult = 10 ^ numDecimalPlaces;
    return floor((num * mult) + 0.5) / mult;
  }

  std::vector<float> DrawDataFrame::roundFloatArray(std::vector<float> a) {
    for (size_t i = 0; i < a.size(); i++) {
      a[i] = round(a[i], 4);
    }
    return a;
  }
  /*
  TYPE DrawDataFrame::serialize() {
    auto frameData = {
          isLinked = isLinked;
          pathDataList = [];
          fillImageBounds = fillImageBounds;
          fillCanvasSize = fillCanvasSize;
    }
    auto lastSerializedPathData = null;
    for (size_t i = 0; i < pathDataList.size(); i++) {
          auto pathData = pathDataList[i];
          auto serializedPathData = {
            points = util.deepCopyTable(pathData.points);
            style = pathData.style;
            bendPoint = roundFloatArray(pathData.bendPoint);
            isFreehand = pathData.isFreehand;
            color = roundFloatArray(pathData.color);
            isTransparent = pathData.isTransparent;
          }
          for (size_t j = 1; j < serializedPathData.points.size(); j++) {
            serializedPathData.points[j].x = round(serializedPathData.points[j].x, 4);
            serializedPathData.points[j].y = round(serializedPathData.points[j].y, 4);
          }
          if (lastSerializedPathData != null && arePathDatasMergable(lastSerializedPathData,
  serializedPathData)) { lastSerializedPathData.points.push_back(serializedPathData.points[2]); }
  else { frameData.pathDataList.push_back(serializedPathData); lastSerializedPathData =
  serializedPathData;
          }
    }
    if (fillImageData) {
          auto fileData = fillImageData.encode("png");
          frameData.fillPng = love.data.encode("string", "base64", fileData.getString());
    }
    return frameData;
  }*/

  void DrawDataFrame::cleanUpPaths() {
    for (size_t i = 0; i < pathDataList.size(); i++) {
      parent()->updatePathDataRendering(&pathDataList[i]);
    }
  }

  Bounds DrawDataFrame::getPathDataBounds(std::optional<Bounds> bounds) {
    if (!bounds) {
      Bounds newBounds;
      newBounds.minX = DRAW_MAX_SIZE;
      newBounds.minY = DRAW_MAX_SIZE;
      newBounds.maxX = -DRAW_MAX_SIZE;
      newBounds.maxY = -DRAW_MAX_SIZE;
      bounds = newBounds;
    }
    // https://poke1024.github.io/tove2d-api/classes/Graphics.html#Graphics:computeAABB
    auto [minX, minY, maxX, maxY] = graphics()->computeAABB();
    minX = minX + (DRAW_LINE_WIDTH / 2);
    minY = minY + (DRAW_LINE_WIDTH / 2);
    maxX = maxX - (DRAW_LINE_WIDTH / 2);
    maxY = maxY - (DRAW_LINE_WIDTH / 2);
    // we still need this because of isTransparent
    for (size_t i = 0; i < pathDataList.size(); i++) {
      auto pathData = pathDataList[i];
      for (size_t j = 0; j < pathData.points.size(); j++) {
        auto x = pathData.points[j].x;
        auto y = pathData.points[j].y;
        if (x < minX) {
          minX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y > maxY) {
          maxY = y;
        }
      }
    }
    if (minX < bounds->minX) {
      bounds->minX = minX;
    }
    if (minY < bounds->minY) {
      bounds->minY = minY;
    }
    if (maxX > bounds->maxX) {
      bounds->maxX = maxX;
    }
    if (maxY > bounds->maxY) {
      bounds->maxY = maxY;
    }
    return *bounds;
  }

  Bounds DrawDataFrame::getPathDataBoundsInPixelCoordinates() {
    auto bounds = getPathDataBounds(std::nullopt);
    Bounds newBounds;
    newBounds.minX = floor(bounds.minX * parent()->fillPixelsPerUnit);
    newBounds.minY = floor(bounds.minY * parent()->fillPixelsPerUnit);
    newBounds.maxX = ceil(bounds.maxX * parent()->fillPixelsPerUnit);
    newBounds.maxY = ceil(bounds.maxY * parent()->fillPixelsPerUnit);
    return newBounds;
  }

  void DrawDataFrame::resetGraphics() {
    _graphicsNeedsReset = true;
  }

  image::ImageData *DrawDataFrame::getFillImageDataSizedToPathBounds() {
    auto pathBounds = getPathDataBoundsInPixelCoordinates();
    auto width = pathBounds.maxX - pathBounds.minX;
    auto height = pathBounds.maxY - pathBounds.minY;
    // imagedata can't have 0 width/height
    if (width < 1) {
      width = 1;
    }
    if (height < 1) {
      height = 1;
    }

    image::Image *instance = Module::getInstance<image::Image>(Module::M_IMAGE);
    if (fillImageData == NULL) {
      fillImageData = std::unique_ptr<image::ImageData>(
          instance->newImageData(width, height, PIXELFORMAT_RGBA8));
    } else if (fillImageData->getWidth() != width || fillImageData->getHeight() != height) {
      auto newFillImageData = std::unique_ptr<image::ImageData>(
          instance->newImageData(width, height, PIXELFORMAT_RGBA8));
      // sourceX, sourceY, sourceWidth, sourceHeight, destX, destY
      newFillImageData->copyImageData(fillImageData.get(), 0, 0,
          fillImageBounds.maxX - fillImageBounds.minX, fillImageBounds.maxY - fillImageBounds.minY,
          fillImageBounds.minX - pathBounds.minX, fillImageBounds.minY - pathBounds.minY);
      fillImageData->release();
      fillImageData = std::move(newFillImageData);
    }
    fillImageBounds.set(pathBounds);
    return fillImageData.get();
  }

  graphics::Image *DrawDataFrame::imageDataToImage(image::ImageData *imageData) {
    graphics::Image::Settings settings;

    graphics::Image::Slices slices(graphics::TEXTURE_2D);
    slices.set(0, 0, imageData);
    graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

    graphics::Image *image = instance->newImage(slices, settings);
    graphics::Texture::Filter f = image->getFilter();
    f.min = graphics::Texture::FILTER_NEAREST;
    f.mag = graphics::Texture::FILTER_NEAREST;
    image->setFilter(f);

    return image;
  }

  graphics::Image *DrawDataFrame::getFillImage() {
    if (fillImage != NULL) {
      return fillImage.get();
    }
    if (fillImageData == NULL) {
      return NULL;
    }
    fillImage = std::unique_ptr<graphics::Image>(imageDataToImage(fillImageData.get()));
    return fillImage.get();
  }

  void DrawDataFrame::updateFillImageWithFillImageData() {
    if (fillImageData == NULL) {
      return;
    }
    if (fillImage != NULL) {
      if (fillImage->getWidth() == fillImageData->getWidth()
          && fillImage->getHeight() == fillImageData->getHeight()) {
        fillImage->replacePixels(fillImageData.get(), 0, 0, 0, 0, false);
        return;
      }
      fillImage->release();
    }
    fillImage = std::unique_ptr<graphics::Image>(imageDataToImage(fillImageData.get()));
  }

  void DrawDataFrame::compressFillCanvas() {
    if (fillImageData == NULL) {
      return;
    }
    if (fillImageData->isEmpty()) {
      fillImageData->release();
      if (fillImage != NULL) {
        fillImage->release();
      }
      fillImageData = NULL;
      fillImage = NULL;
    } else {
      int boundsResult[4] = { -1, -1, -1, -1 };
      fillImageData->getBounds(boundsResult);

      auto [minX, minY, maxX, maxY] = boundsResult;
      auto width = (maxX - minX) + 1;
      auto height = (maxY - minY) + 1;
      image::Image *instance = Module::getInstance<image::Image>(Module::M_IMAGE);
      auto newFillImageData = instance->newImageData(width, height, PIXELFORMAT_RGBA8);
      // sourceX, sourceY, sourceWidth, sourceHeight, destX, destY
      newFillImageData->copyImageData(fillImageData.get(), minX, minY, width, height, 0, 0);
      if (DEBUG_FILL_IMAGE_SIZE) {
        /*for (size_t x = 0; x < width - 1; x++) {
              newFillImageData->setPixel(x, 0, 1, 0, 0, 1);
        }
        for (size_t y = 0; y < height - 1; y++) {
              newFillImageData->setPixel(0, y, 1, 0, 0, 1);
        }*/
      }
      fillImageData->release();
      fillImageData = std::unique_ptr<image::ImageData>(newFillImageData);
      fillImageBounds.minX = fillImageBounds.minX + minX;
      fillImageBounds.minY = fillImageBounds.minY + minY;
      fillImageBounds.maxX = fillImageBounds.maxX + minX;
      fillImageBounds.maxY = fillImageBounds.maxY + minY;
    }
  }

  image::ImageData *DrawDataFrame::canvasToImageData(graphics::Canvas *canvas) {
    image::Image *instance = Module::getInstance<image::Image>(Module::M_IMAGE);
    Rect rect = { 0, 0, canvas->getPixelWidth(), canvas->getPixelHeight() };
    return canvas->newImageData(instance, 0, 0, rect);
  }

  bool DrawDataFrame::floodFill(float x, float y) {
    updatePathsCanvas();
    auto pathsImageData = std::unique_ptr<image::ImageData>(canvasToImageData(pathsCanvas.get()));
    getFillImageDataSizedToPathBounds();
    fillImageData->getFormat();
    image::Pixel p;
    p.rgba8[0] = parent()->color.data[0];
    p.rgba8[1] = parent()->color.data[1];
    p.rgba8[2] = parent()->color.data[2];
    p.rgba8[3] = 1.0;


    auto pixelCount = getFillImageDataSizedToPathBounds()->floodFill(
        floor((x * parent()->fillPixelsPerUnit) - fillImageBounds.minX),
        floor((y * parent()->fillPixelsPerUnit) - fillImageBounds.minY), pathsImageData.get(), p);
    compressFillCanvas();
    updateFillImageWithFillImageData();
    return pixelCount > 0;
  }

  bool DrawDataFrame::floodClear(float x, float y, float radius) {
    updatePathsCanvas();
    auto pathsImageData = canvasToImageData(pathsCanvas.get());
    auto pixelCount = getFillImageDataSizedToPathBounds()->floodFillErase(
        floor((x * parent()->fillPixelsPerUnit) - fillImageBounds.minX),
        floor((y * parent()->fillPixelsPerUnit) - fillImageBounds.minY),
        floor(radius * parent()->fillPixelsPerUnit), pathsImageData);
    compressFillCanvas();
    updateFillImageWithFillImageData();
    return pixelCount > 0;
  }

  void DrawDataFrame::resetFill() {
    cleanUpPaths();
    updatePathsCanvas();
    auto pathsImageData = canvasToImageData(pathsCanvas.get());
    getFillImageDataSizedToPathBounds()->updateFloodFillForNewPaths(pathsImageData);
    compressFillCanvas();
    updateFillImageWithFillImageData();
  }

  graphics::Canvas *DrawDataFrame::newCanvas(int width, int height) {
    graphics::Graphics *instance = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

    graphics::Canvas::Settings settings;
    settings.width = width;
    settings.height = height;
    settings.dpiScale = 1;
    settings.msaa = 4;

    return instance->newCanvas(settings);
  }

  void DrawDataFrame::renderToCanvas(
      graphics::Canvas *canvas, const std::function<void()> &lambda) {
    graphics::Graphics::RenderTarget rt(canvas);

    graphics::Graphics *graphics = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

    graphics::Graphics::RenderTargets oldtargets = graphics->getCanvas();

    for (auto c : oldtargets.colors)
      c.canvas->retain();

    if (oldtargets.depthStencil.canvas != nullptr)
      oldtargets.depthStencil.canvas->retain();

    graphics->setCanvas(rt, false);

    lambda();

    graphics->setCanvas(oldtargets);

    for (auto c : oldtargets.colors)
      c.canvas->release();

    if (oldtargets.depthStencil.canvas != nullptr)
      oldtargets.depthStencil.canvas->release();
  }

  void DrawDataFrame::updatePathsCanvas() {
    auto bounds = getPathDataBoundsInPixelCoordinates();
    auto width = bounds.maxX - bounds.minX;
    auto height = bounds.maxY - bounds.minY;
    // canvas can't have 0 width/height
    if (width < 1) {
      width = 1;
    }
    if (height < 1) {
      height = 1;
    }
    if (pathsCanvas == NULL || pathsCanvas->getWidth() != width
        || pathsCanvas->getHeight() != height) {
      if (pathsCanvas != NULL) {
        pathsCanvas->release();
      }
      pathsCanvas = std::unique_ptr<graphics::Canvas>(newCanvas(width, height));
    }

    renderToCanvas(pathsCanvas.get(), [bounds, this]() {
      graphics::Graphics *graphicsModule
          = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

      graphicsModule->push(graphics::Graphics::STACK_TRANSFORM);
      graphicsModule->origin();
      graphicsModule->translate(-bounds.minX, -bounds.minY);
      graphicsModule->scale(parent()->fillPixelsPerUnit);

      graphics::OptionalColorf clearColor(Colorf(0.0f, 0.0f, 0.0f, 0.0f));
      OptionalInt stencil(0);
      OptionalDouble depth(1.0);
      graphicsModule->clear(clearColor, stencil, depth);

      Colorf color;
      color.r = 1.0;
      color.g = 1.0;
      color.b = 1.0;
      color.a = 1.0;
      graphicsModule->setColor(color);

      graphics()->draw();

      graphicsModule->pop();
    });
  }

  ToveGraphicsHolder *DrawDataFrame::graphics() {
    if (_graphicsNeedsReset || _graphics == NULL) {
      if (_graphics != NULL) {
        _graphics = nullptr;
      }

      _graphicsNeedsReset = false;
      cleanUpPaths();
      _graphics = std::make_unique<ToveGraphicsHolder>();
      for (size_t i = 0; i < pathDataList.size(); i++) {
        _graphics->addPath(pathDataList[i].tovePath);
      }
    }
    return _graphics.get();
  }

  void DrawDataFrame::renderFill() {
    auto fillImage = getFillImage();
    if (fillImage != NULL) {
      graphics::Graphics *graphicsModule
          = Module::getInstance<graphics::Graphics>(Module::M_GRAPHICS);

      float x = fillImageBounds.minX / parent()->fillPixelsPerUnit;
      float y = fillImageBounds.minY / parent()->fillPixelsPerUnit;
      float a = 0.0;
      float sx = 1 / parent()->fillPixelsPerUnit;
      float sy = 1 / parent()->fillPixelsPerUnit;

      // Avoid using `love::graphics::Graphics::draw` directly since it needs to stream vertex
      // information, which doesn't perform well on WebGL -- we'll just keep and use our own static
      // mesh of vertex information instead
      //
      // This was the old code:
      //   Matrix4 mat = Matrix4(x, y, a, sx, sy, 0.0, 0.0, 0.0, 0.0);
      //   graphicsModule->draw(fillImage, mat);
      //
      static auto quad = [&]() {
        std::vector<love::graphics::Vertex> quadVerts {
          { 0, 0, 0, 0, { 0xff, 0xff, 0xff, 0xff } },
          { 1, 0, 1, 0, { 0xff, 0xff, 0xff, 0xff } },
          { 1, 1, 1, 1, { 0xff, 0xff, 0xff, 0xff } },
          { 0, 1, 0, 1, { 0xff, 0xff, 0xff, 0xff } },
        };
        return std::unique_ptr<love::graphics::Mesh>(graphicsModule->newMesh(quadVerts,
            love::graphics::PRIMITIVE_TRIANGLE_FAN, love::graphics::vertex::USAGE_STATIC));
      }();
      quad->setTexture(fillImage);
      auto iw = fillImage->getWidth(), ih = fillImage->getHeight();
      quad->draw(graphicsModule, love::Matrix4(x, y, a, sx * iw, sy * ih, 0, 0, 0, 0));
      quad->setTexture(nullptr);
    }
  }
  /*


  TYPE DrawDataFrame::renderPreviewPng(TYPE size) {
    if (isLinked) {
          return null;
    }
    if (!size) {
          size = 256;
    }
    auto previewCanvas = love.graphics.newCanvas(size, size, {
          dpiscale = 1;
          msaa = 4;
    });
    previewCanvas.renderTo(undefined);
   / *
   TYPE DrawDataFrame::function() {
     auto pathBounds = getPathDataBounds();
     auto width = pathBounds.maxX - pathBounds.minX;
     auto height = pathBounds.maxY - pathBounds.minY;
     auto maxDimension = width;
     if (height > maxDimension) {
           maxDimension = height;
     }
     auto widthPadding = (maxDimension - width) / 2;
     auto heightPadding = (maxDimension - height) / 2;
     auto padding = maxDimension * 0.025;
     love.graphics.push("all");
     love.graphics.origin();
     love.graphics.scale(size / (maxDimension * 1.05));
     love.graphics.translate((padding - pathBounds.minX) + widthPadding, (padding - pathBounds.minY)
  + heightPadding); love.graphics.clear(0, 0, 0, 0); love.graphics.setColor(1, 1, 1, 1);
     renderFill();
     graphics().draw();
     love.graphics.pop();
   }

   * /



    auto fileData = previewCanvas.newImageData().encode("png");
    return love.data.encode("string", "base64", fileData.getString());
  }*/


}
}
