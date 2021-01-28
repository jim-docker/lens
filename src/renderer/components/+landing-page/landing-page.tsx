import "./landing-page.scss";
import React from "react";
import { observable, autorun } from "mobx";
import { observer } from "mobx-react";
import { clusterStore } from "../../../common/cluster-store";
import { Workspace, workspaceStore } from "../../../common/workspace-store";
import { PageLayout } from "../layout/page-layout"
import { Select, SelectOption } from "../select";
import { WorkspaceOverview } from "./workspace-overview"
import { AddWorkspaceDialog } from "./add-workspace-dialog"
@observer
export class LandingPage extends React.Component {
  @observable showHint = true;

  get workspace(): Workspace {
    return workspaceStore.currentWorkspace;
  }
  
  render() {
    const clusters = clusterStore.getByWorkspaceId(workspaceStore.currentWorkspaceId);
    const noClustersInScope = !clusters.length;
    const showStartupHint = this.showHint && noClustersInScope;

    const onWorkspaceChange = (option: SelectOption) => {
      console.log("option value:", option.value);
      if (option.value === "New Workspace") {
        AddWorkspaceDialog.open();
        return;
      }

      const selectedWorkspace = workspaceStore.getByName(option.value);

      if (!selectedWorkspace) {
        return;
      }

      console.log("workspaceStore.setActive(selectedWorkspace.id)");
      workspaceStore.setActive(selectedWorkspace.id);
    }

    const existingWorkspaces = workspaceStore.enabledWorkspacesList.map(w => ({value: w.name, label: w.name}));
    return (
        <div className="LandingPage flex auto">
          {showStartupHint && (
            <div className="startup-hint flex column gaps" onMouseEnter={() => this.showHint = false}>
              <p>This is the quick launch menu.</p>
              <p>
                Click the + button to add clusters and choose the ones you want to access via quick launch menu.
              </p>
            </div>
          )}
          <div className="flex column">
            <h2 className="flex center gaps">
              <span className="box right">Workspace:</span>       
              <Select
                options={[{value: "New Workspace", label: "New Workspace..."}, ...existingWorkspaces]}
                value={this.workspace.name}
                onChange={onWorkspaceChange}
                className="box left"
              />
            </h2>
            <WorkspaceOverview workspace={this.workspace}/>
            <AddWorkspaceDialog/>
          </div>
        </div>
    );
  }
}
