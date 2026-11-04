import Foundation
import Vision
import AppKit
let directory = CommandLine.arguments[1]
let files = try FileManager.default.contentsOfDirectory(atPath: directory).filter{$0.hasSuffix(".png")}.sorted()
for file in files {
 let url = URL(fileURLWithPath: directory).appendingPathComponent(file)
 let request = VNRecognizeTextRequest()
 request.recognitionLevel = .accurate
 request.recognitionLanguages = ["it-IT", "en-US"]
 request.usesLanguageCorrection = true
 do {
  try VNImageRequestHandler(url: url).perform([request])
  let text = (request.results ?? []).compactMap{$0.topCandidates(1).first?.string}.joined(separator:"\n")
  try text.write(to: url.deletingPathExtension().appendingPathExtension("txt"), atomically:true, encoding:.utf8)
  print(file)
 } catch { print("ERROR \(file): \(error)") }
}
