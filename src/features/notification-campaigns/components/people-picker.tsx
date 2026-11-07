import Autocomplete from "@mui/material/Autocomplete";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";

import { ErgButton, ErgTextField } from "@/components/erg-mui";

import { usePeopleSearch } from "../api/campaign-query";
import type { RecipientCard } from "../api/campaign-types";
import { type AudienceDraft, addPicked } from "../model/audience-draft";
import { PastePanel } from "./paste-panel";

type Props = { draft: AudienceDraft; onChange: (draft: AudienceDraft) => void };

/** Search by name / code / phone / email (max 20 hits), plus paste or file import. Combobox + listbox via MUI Autocomplete. */
export function PeoplePicker({ draft, onChange }: Props) {
  const [input, setInput] = useState("");
  const helpId = useId();
  const { data, isFetching } = usePeopleSearch(input);
  const pickedIds = new Set(draft.picked.map((c) => c.userId));
  const options = (data ?? []).filter((c) => !pickedIds.has(c.userId));

  const pick = (cards: RecipientCard[]) => {
    onChange(addPicked(draft, cards));
    setInput("");
  };

  return (
    <Stack spacing={1.5}>
      <Autocomplete<RecipientCard>
        clearOnBlur
        filterOptions={(all) => all}
        getOptionKey={(option) => option.userId ?? option.displayName ?? ""}
        getOptionLabel={(option) => option.displayName ?? ""}
        inputValue={input}
        isOptionEqualToValue={(a, b) => a.userId === b.userId}
        loading={isFetching}
        loadingText="Đang tìm…"
        noOptionsText={input.trim().length < 2 ? "Nhập ít nhất 2 ký tự" : "Không tìm thấy ai"}
        onChange={(_event, card) => card && pick([card])}
        onInputChange={(_event, value, reason) => reason !== "reset" && setInput(value)}
        options={options}
        renderInput={(params) => (
          <ErgTextField
            {...params}
            label="Tìm theo tên, mã, số điện thoại hoặc email"
            slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, "aria-describedby": helpId } }}
          />
        )}
        renderOption={({ key, ...props }, option) => (
          <li key={key} {...props}>
            <Stack sx={{ minWidth: 0 }}>
              <Typography noWrap variant="body2">{option.displayName}</Typography>
              <Typography color="text.secondary" noWrap variant="caption">{option.meta}</Typography>
            </Stack>
          </li>
        )}
        value={null}
      />
      <Typography color="text.secondary" id={helpId} variant="caption">
        Hiện tối đa 20 kết quả.
      </Typography>
      {options.length > 1 ? (
        <ErgButton onClick={() => pick(options)} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined">
          {`Chọn cả ${options.length}`}
        </ErgButton>
      ) : null}
      <PastePanel draft={draft} onChange={onChange} />
    </Stack>
  );
}
