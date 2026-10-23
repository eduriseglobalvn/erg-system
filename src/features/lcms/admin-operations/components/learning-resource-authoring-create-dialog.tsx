import { useTaxonomyCreateDialogController } from "./learning-resource-authoring-create-dialog-controller";
import { TaxonomyCreateDialogView } from "./learning-resource-authoring-create-dialog-view";

export { QuickIconPicker } from "./learning-resource-authoring-create-dialog-fields";

export function TaxonomyCreateDialog(props: Parameters<typeof useTaxonomyCreateDialogController>[0]) {
  return <TaxonomyCreateDialogView controller={useTaxonomyCreateDialogController(props)} />;
}
