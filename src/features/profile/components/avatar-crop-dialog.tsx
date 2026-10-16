import Upload from "@mui/icons-material/FileUploadRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import type { PointerEvent as ReactPointerEvent, SyntheticEvent } from "react";
import { CROP_PREVIEW_SIZE, type AvatarCropState } from "@/features/profile/types/profile-types";
import { clampAvatarOffset, getAvatarGeometry } from "@/features/profile/utils/profile-avatar";

export function AvatarCropDialog({ crop, isUploading, onChange, onClose, onPickAnother, onUpload }: {
  crop: AvatarCropState | null;
  isUploading: boolean;
  onChange: (crop: AvatarCropState | null | ((current: AvatarCropState | null) => AvatarCropState | null)) => void;
  onClose: () => void;
  onPickAnother: () => void;
  onUpload: () => Promise<void>;
}) {
  const geometry = crop?.image ? getAvatarGeometry(crop.image, crop.zoom, crop.offset, CROP_PREVIEW_SIZE) : null;

  const updateZoom = (value: number) => {
    onChange((current) => {
      if (!current) return current;
      const nextZoom = Number(value.toFixed(2));
      return {
        ...current,
        zoom: nextZoom,
        offset: current.image ? clampAvatarOffset(current.offset, current.image, nextZoom, CROP_PREVIEW_SIZE) : current.offset,
      };
    });
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!crop?.image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange((current) =>
      current
        ? {
            ...current,
            drag: {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: current.offset.x,
              originY: current.offset.y,
            },
          }
        : current,
    );
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    onChange((current) => {
      if (!current?.drag || !current.image || current.drag.pointerId !== event.pointerId) return current;
      const offset = clampAvatarOffset(
        {
          x: current.drag.originX + event.clientX - current.drag.startX,
          y: current.drag.originY + event.clientY - current.drag.startY,
        },
        current.image,
        current.zoom,
        CROP_PREVIEW_SIZE,
      );
      return { ...current, offset };
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    onChange((current) => {
      if (!current?.drag || current.drag.pointerId !== event.pointerId) return current;
      return { ...current, drag: null };
    });
  };

  return (
    <Dialog
      open={Boolean(crop)}
      onClose={() => onClose()}
      maxWidth={false}
      slotProps={{ paper: { sx: { maxWidth: 760, borderRadius: 2, overflow: "hidden" } } }}
    >
      <div>
        <Box component="div" sx={{"height":"calc(0.25rem * 1.5)","backgroundColor":"var(--erg-blue)"}} />
        <Box component="div" sx={{"borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","paddingInline":"calc(0.25rem * 6)","paddingBlock":"calc(0.25rem * 5)"}}>
          <Box component="h2" sx={{"fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"var(--foreground)"}}>Căn chỉnh ảnh đại diện</Box>
          <Box component="p" sx={{"fontSize":"0.875rem","lineHeight":"calc(0.25rem * 5)","color":"var(--muted-foreground)"}}>Kéo ảnh để đặt khuôn mặt vào giữa khung, điều chỉnh zoom rồi lưu lên R2.</Box>
        </Box>

        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { lg: "360px minmax(0,1fr)" }, p: 3 }}>
          <Box component="div" sx={{"display":"flex","flexDirection":"column","alignItems":"center","gap":"calc(0.25rem * 4)"}}>
            <Box component="div"
              sx={{"position":"relative","display":"grid","WebkitUserSelect":"none","userSelect":"none","placeItems":"center","overflow":"hidden","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(12.9% 0.042 264.695)"}}
              style={{ width: CROP_PREVIEW_SIZE, height: CROP_PREVIEW_SIZE }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {crop ? (
                <Box component="img"
                  src={crop.previewUrl}
                  alt="Avatar preview"
                  sx={{"position":"absolute","maxWidth":"none","cursor":"grab","objectFit":"cover","&:active":{"cursor":"grabbing"}}}
                  draggable={false}
                  style={
                    geometry
                      ? {
                          width: geometry.width,
                          height: geometry.height,
                          left: CROP_PREVIEW_SIZE / 2 + geometry.offset.x,
                          top: CROP_PREVIEW_SIZE / 2 + geometry.offset.y,
                          transform: "translate(-50%, -50%)",
                        }
                      : { maxWidth: "100%" }
                  }
                  onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
                    const image = event.currentTarget;
                    onChange((current) =>
                      current
                        ? {
                            ...current,
                            image: { width: image.naturalWidth, height: image.naturalHeight },
                            offset: { x: 0, y: 0 },
                          }
                        : current,
                    );
                  }}
                />
              ) : null}
              <Box component="div" sx={{"pointerEvents":"none","position":"absolute","inset":"calc(0.25rem * 0)","backgroundColor":"color-mix(in srgb, oklch(12.9% 0.042 264.695) 70%, transparent)","@supports (color: color-mix(in lab, red, red))":{"backgroundColor":"color-mix(in oklab, oklch(12.9% 0.042 264.695) 70%, transparent)"}}} />
              <Box component="div" sx={{"pointerEvents":"none","position":"absolute","left":"calc(1 / 2 * 100%)","top":"calc(1 / 2 * 100%)","width":"240px","height":"240px","translate":"0 calc(calc(1 / 2 * 100%) * -1)","borderRadius":"9999px","borderStyle":"solid","borderWidth":"2px","borderColor":"#fff"}} />
            </Box>
            <Box component="p" sx={{"textAlign":"center","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(55.4% 0.046 257.417)"}}>Ảnh sau khi lưu sẽ được crop vuông 512px và BE tối ưu lại trước khi đưa lên R2.</Box>
          </Box>

          <Box component="div" sx={{"display":"flex","flexDirection":"column","justifyContent":"space-between","gap":"calc(0.25rem * 6)"}}>
            <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","padding":"calc(0.25rem * 4)"}}>
              <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","gap":"calc(0.25rem * 3)"}}>
                <div>
                  <Box component="p" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>Preview</Box>
                  <Box component="p" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)"}}>Hiển thị trong LMS</Box>
                </div>
                <Box component="div" sx={{"width":"calc(0.25rem * 20)","height":"calc(0.25rem * 20)","overflow":"hidden","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"}}>
                  {crop ? (
                    <Box component="div" sx={{"position":"relative","height":"100%","width":"100%","overflow":"hidden","borderRadius":"9999px","backgroundColor":"oklch(96.8% 0.007 247.896)"}}>
                      <Box component="img"
                        src={crop.previewUrl}
                        alt="Avatar round preview"
                        sx={{"position":"absolute","maxWidth":"none"}}
                        draggable={false}
                        style={
                          geometry
                            ? {
                                width: geometry.width / 4,
                                height: geometry.height / 4,
                                left: 40 + geometry.offset.x / 4,
                                top: 40 + geometry.offset.y / 4,
                                transform: "translate(-50%, -50%)",
                              }
                            : { width: "100%", height: "100%", objectFit: "cover" }
                        }
                      />
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>

            <div>
              <Box component="div" sx={{"display":"flex","alignItems":"center","justifyContent":"space-between","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(37.2% 0.044 257.287)"}}>
                <span>Zoom</span>
                <span>{Math.round((crop?.zoom ?? 1) * 100)}%</span>
              </Box>
              <Box component="input"
                sx={{"marginTop":"calc(0.25rem * 3)","height":"calc(0.25rem * 2)","width":"100%","accentColor":"var(--erg-blue)"}}
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={crop?.zoom ?? 1}
                onChange={(event) => updateZoom(Number(event.target.value))}
              />
              <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","display":"flex","gap":"calc(0.25rem * 2)"}}>
                <Button type="button" variant="outlined" sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem"}} onClick={() => updateZoom(1)} disabled={isUploading}>
                  Reset
                </Button>
                <Button type="button" variant="outlined" sx={{"height":"calc(0.25rem * 10)","borderRadius":"0.5rem"}} startIcon={<Upload sx={{ fontSize: 16 }} />} onClick={onPickAnother} disabled={isUploading}>
                  Chọn ảnh khác
                </Button>
              </Box>
            </div>

            <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"#b8d6fa","backgroundColor":"var(--erg-blue-light)","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 3)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","fontWeight":"600","color":"var(--erg-blue)"}}>
              Đường dẫn R2 sau khi lưu: <Box component="span" sx={{"fontWeight":"600"}}>avatar/{"{userID}"}/...</Box>
            </Box>
          </Box>
        </Box>

        <Box component="div" sx={{"display":"flex","justifyContent":"flex-end","gap":"calc(0.25rem * 2)","borderTopStyle":"solid","borderTopWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)","paddingInline":"calc(0.25rem * 6)","paddingBlock":"calc(0.25rem * 4)"}}>
          <Button type="button" variant="outlined" sx={{"borderRadius":"0.5rem"}} onClick={onClose} disabled={isUploading}>
            Hủy
          </Button>
          <Button type="button" variant="contained" startIcon={isUploading ? <CircularProgress color="inherit" size={16} /> : <Upload sx={{ fontSize: 16 }} />} sx={{"borderRadius":"0.375rem","backgroundColor":"var(--erg-blue)","color":"#fff","&:hover":{"@media (hover: hover)":{"backgroundColor":"var(--erg-blue-hover)"}}}} onClick={() => void onUpload()} disabled={!crop?.image || isUploading}>
            Lưu avatar
          </Button>
        </Box>
      </div>
    </Dialog>
  );
}

