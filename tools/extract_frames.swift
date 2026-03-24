import AVFoundation
import CoreGraphics
import CoreImage
import Foundation
import ImageIO

struct FrameExtractor {
    let inputURL: URL
    let outputDirectory: URL
    let frameCount: Int

    func run() throws {
        let asset = AVAsset(url: inputURL)
        let durationSeconds = asset.duration.seconds
        guard durationSeconds.isFinite, durationSeconds > 0 else {
            throw NSError(domain: "FrameExtractor", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Unable to read video duration."
            ])
        }

        try FileManager.default.createDirectory(
            at: outputDirectory,
            withIntermediateDirectories: true
        )

        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.requestedTimeToleranceAfter = .zero
        generator.requestedTimeToleranceBefore = .zero

        let ciContext = CIContext()
        let times = sampledTimes(durationSeconds: durationSeconds)

        for (index, second) in times.enumerated() {
            let time = CMTime(seconds: second, preferredTimescale: 600)
            let cgImage = try generator.copyCGImage(at: time, actualTime: nil)
            let imageURL = outputDirectory.appendingPathComponent(
                String(format: "frame_%02d_%05.2fs.png", index + 1, second)
            )
            try writePNG(cgImage: cgImage, context: ciContext, to: imageURL)
            print(imageURL.path)
        }
    }

    private func sampledTimes(durationSeconds: Double) -> [Double] {
        if frameCount <= 1 {
            return [durationSeconds / 2]
        }

        let start = min(0.3, durationSeconds * 0.05)
        let end = max(start, durationSeconds - min(0.3, durationSeconds * 0.05))
        let step = (end - start) / Double(frameCount - 1)
        return (0..<frameCount).map { start + step * Double($0) }
    }

    private func writePNG(cgImage: CGImage, context: CIContext, to url: URL) throws {
        let ciImage = CIImage(cgImage: cgImage)
        guard let colorSpace = cgImage.colorSpace ?? CGColorSpace(name: CGColorSpace.sRGB) else {
            throw NSError(domain: "FrameExtractor", code: 2, userInfo: [
                NSLocalizedDescriptionKey: "Unable to resolve image color space."
            ])
        }

        try context.writePNGRepresentation(
            of: ciImage,
            to: url,
            format: .RGBA8,
            colorSpace: colorSpace
        )
    }
}

func parseArguments() -> (inputURL: URL, outputDirectory: URL, frameCount: Int)? {
    let arguments = CommandLine.arguments
    guard arguments.count >= 3 else {
        fputs("Usage: swift tools/extract_frames.swift <video-path> <output-dir> [frame-count]\n", stderr)
        return nil
    }

    let inputURL = URL(fileURLWithPath: arguments[1])
    let outputDirectory = URL(fileURLWithPath: arguments[2], isDirectory: true)
    let frameCount = arguments.count >= 4 ? max(Int(arguments[3]) ?? 6, 1) : 6
    return (inputURL, outputDirectory, frameCount)
}

guard let options = parseArguments() else {
    exit(64)
}

do {
    let extractor = FrameExtractor(
        inputURL: options.inputURL,
        outputDirectory: options.outputDirectory,
        frameCount: options.frameCount
    )
    try extractor.run()
} catch {
    fputs("\(error)\n", stderr)
    exit(1)
}
