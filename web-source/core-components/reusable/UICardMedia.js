import * as React from "react";
import ReactMarkdown from "react-markdown";
import url from "url";

import * as Constants from "~/common/constants";
import * as UISVG from "~/core-components/reusable/UISVG";
import * as Strings from "~/common/strings";

import { css } from "react-emotion";

import UIButtonIconHorizontal from "~/core-components/reusable/UIButtonIconHorizontal";
import ControlFeedbackPopover from "~/core-components/controls/ControlFeedbackPopover";

const STYLES_CONTAINER = css`
  padding: 16px;
  border-top: 1px solid ${Constants.colors.white20};
  border-radius: 2px;
  background: #d20014;
  color: ${Constants.colors.white};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const STYLES_CONTAINER_PREVIEW = css`
  padding: 16px;
  border-radius: 4px;
  border: 1px solid ${Constants.colors.white20};
`;

const STYLES_CONTAINER_PREVIEW_LABEL = css`
  font-size: 10px;
  margin-bottom: 16px;
  font-weight: 600;
`;

const STYLES_CONTAINER_PREVIEW_NAME = css`
  font-size: 48px;
  font-weight: 700;
`;

const STYLES_BYLINE = css`
  margin-top: 8px;
  font-size: 10px;
  margin-bottom: 24px;
`;

const STYLES_SECTION = css`
  margin-top: 24px;
`;

const STYLES_SECTION_TITLE = css`
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid ${Constants.colors.white20};
`;

const STYLES_SECTION_PARAGRAPH = css`
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
`;

class InstructionsMarkdownImage extends React.Component {
  render() {
    return (
      <img
        style={{
          maxWidth: "85%",
          margin: 10
        }}
        src={this.props.src}
        alt={this.props.alt}
      />
    );
  }
}

class InstructionsMarkdownLink extends React.Component {
  render() {
    return (
      <a
        href={this.props.href}
        onClick={e => {
          shell.openExternal(this.props.href);
          e.preventDefault();
          return true;
        }}
        {...this.props}
      />
    );
  }
}

export default class UICardMedia extends React.Component {
  render() {
    const name = this.props.media ? this.props.media.name : "Untitled";
    const username =
      this.props.media && this.props.media.user
        ? this.props.media.user.username
        : "Anonymous";
    const createdTime = this.props.media
      ? this.props.media.published
      : new Date();
    const instructions = this.props.media ? this.props.media.instructions : "";
    const description = this.props.media ? this.props.media.description : "";

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTAINER_PREVIEW}>
          <div className={STYLES_CONTAINER_PREVIEW_LABEL}>Name</div>
          <div className={STYLES_CONTAINER_PREVIEW_NAME}>{name}</div>
        </div>
        <div className={STYLES_BYLINE}>
          Created by {username} — {Strings.toDate(createdTime)}
        </div>

        <div className={STYLES_SECTION}>
          <div className={STYLES_SECTION_TITLE}>Support {name} on itch.io</div>
          <div className={STYLES_SECTION_PARAGRAPH}>
            This game is hosted on itch.io. You can support this game creator by
            buying their games there.
          </div>

          {/* <ControlFeedbackPopover onRegisterMedia={() => {
            console.log("Open link to their itch.io page");
          }}> */}
            <UIButtonIconHorizontal
              style={{ marginTop: 24 }}
              icon={<UISVG.Favorite height="16px" />}
            >
              Support {name} on itch.io
            </UIButtonIconHorizontal>
          {/* </ControlFeedbackPopover> */}
        </div>

        <div className={STYLES_SECTION}>
          <div className={STYLES_SECTION_TITLE}>Instructions</div>
          <div className={STYLES_SECTION_PARAGRAPH}>
            <ReactMarkdown
              source={
                instructions &&
                instructions.markdown &&
                instructions.markdown.content
              }
              renderers={{
                image: props => {
                  return (
                    <img
                      style={{
                        maxWidth: "85%",
                        margin: 10
                      }}
                      src={props.src}
                      alt={this.props.alt}
                    />
                  );
                },
                link: props => {
                  return (
                    <a
                      href={this.props.href}
                      onClick={e => {
                        // shell.openExternal(this.props.href);
                        console.log("Open " + this.props.href);
                        e.preventDefault();
                        return true;
                      }}
                      {...this.props}
                    />
                  );
                }
              }}
              transformImageUri={uri => {
                if (!uri) {
                  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==";
                }
                let imageUrl = url.resolve(
                  "https://static.jam.vg",
                  uri.replace(/^\/+/, "/")
                );
                // console.log({
                //   imageUrl,
                //   itchUrl: this.props.game.itchUrl,
                //   uri,
                // });
                return imageUrl;
              }}
              transformLinkUri={uri => {
                return url.resolve(instructions.markdown.root || "", uri || "");
              }}
            />
          </div>
        </div>

        <div className={STYLES_SECTION}>
          <div className={STYLES_SECTION_TITLE}>Is this your game?</div>
          <div className={STYLES_SECTION_PARAGRAPH}>
            Castle lists all the games from a game jam, so people can browse and
            play them all easily. If you created this game and want to claim it,
            change the way it is presented, or remove it, please contact the
            Castle team and let us know.
          </div>

          <ControlFeedbackPopover onRegisterMedia={this.props.onRegisterMedia}>
            <UIButtonIconHorizontal
              style={{ marginTop: 24 }}
              icon={<UISVG.Mail height="16px" />}
            >
              Contact us
            </UIButtonIconHorizontal>
          </ControlFeedbackPopover>
        </div>
      </div>
    );
  }
}
