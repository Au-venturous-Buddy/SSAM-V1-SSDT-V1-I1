import React from "react";
import { graphql } from "gatsby";
import ComicStripPage from '../components/comic-strip-page'
import ComicStripBase from "../components/comic-strip-base"
import allModes from "../assets/modes.json";
import tableBackgrounds from "../assets/table-backgrounds.json";

function generatePages(scenes, dialogues, dialoguesAlt, callAt) {
  var pages = [];
  var pageNum = 0;
  var maxPageNum = Math.max(parseInt(scenes[scenes.length - 1].name), parseInt(dialogues[dialogues.length - 1].name));
  var currentScene = null;
  var currentDialogue = null;
  var nextDialogueID = 0;
  var nextSceneID = 0;
  var callAtIndex = 0;
  while(pageNum <= maxPageNum && callAtIndex < callAt.length) {
    if(nextDialogueID < dialogues.length && parseInt(dialogues[nextDialogueID].name) === pageNum) {
      currentDialogue = dialogues[nextDialogueID];
      nextDialogueID++;
    }

    if(nextSceneID < scenes.length && parseInt(scenes[nextSceneID].name) === pageNum) {
      currentScene = scenes[nextSceneID];
      nextSceneID++;
    }

    if(callAt[callAtIndex] === pageNum) {
      pages.push(
        <div aria-label={dialoguesAlt[pageNum]} key={pageNum.toString()}>
          <ComicStripPage scene={currentScene} dialogue={currentDialogue} keyID={pageNum.toString()} />
        </div>
      )
      callAtIndex++;
    }

    pageNum++;
  }

  return pages;
}

function compileComicStrip(data, state, modes) {
  var callAt = modes[state.currentMode]

  var metadataItems = null;
  var scenes = [];
  var dialogues = [];
  var dialoguesAlt = [];
  var currentLanguageCode = `en`;
  var languages = new Set();
  for(var i = 0; i < data.allFile.edges.length; i++) {
    var nodeItem = data.allFile.edges[i].node
    if(nodeItem.relativeDirectory.includes("SCENES") && nodeItem.ext === ".png") {
      scenes.push(nodeItem);
    }
    else if(nodeItem.relativeDirectory.includes("DIALOGUES") && nodeItem.ext === ".png") {
      languages.add(nodeItem.relativeDirectory.split("/")[nodeItem.relativeDirectory.split("/").length - 1])
      if(nodeItem.relativeDirectory.includes("DIALOGUES/" + state.currentLanguage)) {
        dialogues.push(nodeItem);
      }
    }
    else if(nodeItem.relativeDirectory.includes("DIALOGUES") && nodeItem.ext === ".md" && nodeItem.name === "dialogue-alt" && nodeItem.relativeDirectory.includes("DIALOGUES/" + state.currentLanguage)) {
      dialoguesAlt = nodeItem.childMarkdownRemark.frontmatter.dialogue_alt
      currentLanguageCode = nodeItem.childMarkdownRemark.frontmatter.language_code
    }
    else if(nodeItem.ext === ".md" && nodeItem.name === "index") {
      metadataItems = nodeItem;
    }
  }

  var languageOptions = []
  languages.forEach((value) => {
    languageOptions.push(<option key={value}>{value}</option>)
  })

  var pages = generatePages(scenes, dialogues, dialoguesAlt, callAt);

  return {
    metadataItems,
    languageOptions,
    currentLanguageCode,
    pages
  }
}

export default function ComicStripv2022_2(props) {
  const modeOptions = Object.keys(allModes);
  const tableBackgroundOptions = tableBackgrounds;

  return(
    <ComicStripBase 
      data={props.data}
      modeOptions={modeOptions}
      defaultMode={modeOptions[0]}
      modes={allModes}
      tableBackgroundOptions={tableBackgroundOptions}
      defaultTableBackground={tableBackgroundOptions[0]}
      tableBackgrounds={tableBackgrounds}
      defaultLanguage="English"
      compile={compileComicStrip}
    />
  )
}

export const query = graphql`
  query {
    allFile(
      filter: {relativeDirectory: {regex: "/assets/*/"}}
      sort: {relativePath: ASC}
    ) {
      edges {
        node {
          name
          ext
          relativeDirectory
          childMarkdownRemark {
            frontmatter {
              title
              format
              language_code
              dialogue_alt
            }
          }
          publicURL
        }
      }
    }
  }
`