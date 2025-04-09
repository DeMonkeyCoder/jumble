class VideoManager {
  private static currentPlaying: HTMLVideoElement | null = null
  private static pipCallback: (() => void) | null = null

  static setCurrent(video: HTMLVideoElement) {
    if (VideoManager.currentPlaying && VideoManager.currentPlaying !== video) {
      VideoManager.currentPlaying.pause()
      VideoManager.clearPiP()
    }
    VideoManager.currentPlaying = video
  }

  static clearCurrent(video: HTMLVideoElement) {
    if (VideoManager.currentPlaying === video) {
      VideoManager.currentPlaying = null
    }
  }

  static setPiPCallback(callback: () => void) {
    VideoManager.pipCallback = callback
  }

  static clearPiP() {
    if (VideoManager.pipCallback) {
      VideoManager.pipCallback()
      VideoManager.pipCallback = null
    }
  }
}

export default VideoManager
