import * as React from "react";

import CoreApp from "~/core-components/CoreApp";

export default props => {
  return <CoreApp state={props.state} storage={props.storage} />;
};
