// This script fixes YouTubei.js parser to support LockupView items in HorizontalCardList
// YouTube API now returns LockupView items for channel videos, but the parser schema doesn't recognize them
// This patch adds LockupView to the accepted types in HorizontalCardList parser
// This script only makes changes if they are needed, so running it multiple times doesn't cause any problems

import { closeSync, ftruncateSync, openSync, readFileSync, writeSync } from 'fs'
import { resolve } from 'path'

const YOUTUBEI_DIST_DIR = resolve(import.meta.dirname, '../node_modules/youtubei.js/dist/src/parser/classes')

function fixHorizontalCardListJS() {
  let fixed = false

  let fileHandle
  try {
    fileHandle = openSync(`${YOUTUBEI_DIST_DIR}/HorizontalCardList.js`, 'r+')

    let contents = readFileSync(fileHandle, 'utf-8')

    // Check if LockupView is already imported
    if (!contents.includes('import LockupView')) {
      // Add LockupView import
      contents = contents.replace(
        "import VideoAttributeView from './VideoAttributeView.js';",
        "import VideoAttributeView from './VideoAttributeView.js';\nimport LockupView from './LockupView.js';"
      )
    }

    // Check if LockupView is already in the parser array
    if (!contents.includes('[VideoAttributeView, SearchRefinementCard, MacroMarkersListItem, GameCard, VideoCard, LockupView]')) {
      // Add LockupView to the parser array
      contents = contents.replace(
        'Parser.parseArray(data.cards, [VideoAttributeView, SearchRefinementCard, MacroMarkersListItem, GameCard, VideoCard])',
        'Parser.parseArray(data.cards, [VideoAttributeView, SearchRefinementCard, MacroMarkersListItem, GameCard, VideoCard, LockupView])'
      )
      fixed = true
    }

    if (fixed) {
      ftruncateSync(fileHandle)
      writeSync(fileHandle, contents, 0, 'utf-8')
    }
  } finally {
    if (typeof fileHandle !== 'undefined') {
      closeSync(fileHandle)
    }
  }

  return fixed
}

function fixHorizontalCardListDTS() {
  let fixed = false

  let fileHandle
  try {
    fileHandle = openSync(`${YOUTUBEI_DIST_DIR}/HorizontalCardList.d.ts`, 'r+')

    let contents = readFileSync(fileHandle, 'utf-8')

    // Check if LockupView is already imported
    if (!contents.includes('import LockupView')) {
      // Add LockupView import
      contents = contents.replace(
        "import VideoAttributeView from './VideoAttributeView.js';",
        "import VideoAttributeView from './VideoAttributeView.js';\nimport LockupView from './LockupView.js';"
      )
    }

    // Check if LockupView is already in the type union
    if (!contents.includes('VideoAttributeView | SearchRefinementCard | MacroMarkersListItem | GameCard | VideoCard | LockupView')) {
      // Add LockupView to the type union
      contents = contents.replace(
        'cards: ObservedArray<VideoAttributeView | SearchRefinementCard | MacroMarkersListItem | GameCard | VideoCard>;',
        'cards: ObservedArray<VideoAttributeView | SearchRefinementCard | MacroMarkersListItem | GameCard | VideoCard | LockupView>;'
      )
      fixed = true
    }

    if (fixed) {
      ftruncateSync(fileHandle)
      writeSync(fileHandle, contents, 0, 'utf-8')
    }
  } finally {
    if (typeof fileHandle !== 'undefined') {
      closeSync(fileHandle)
    }
  }

  return fixed
}

function fixHorizontalCardList() {
  const fixedJS = fixHorizontalCardListJS()
  const fixedDTS = fixHorizontalCardListDTS()

  if (fixedJS || fixedDTS) {
    console.log('Fixed YouTubei.js HorizontalCardList to support LockupView')
  }
}

fixHorizontalCardList()
