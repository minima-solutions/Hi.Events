import {t, Trans} from "@lingui/macro";
import {IconCamera, IconCheck, IconLogin, IconLogout, IconScan, IconVolume, IconVolumeOff, IconX} from "@tabler/icons-react";
import {ActionIcon} from "@mantine/core";
import {InlineCameraScanner} from "./InlineCameraScanner.tsx";
import classes from "./ScanTab.module.scss";
import {RecentScan} from "../types.ts";

export type ScanMode = "usb" | "camera";
export type ScanAction = "check-in" | "check-out";

interface ScanTabProps {
    mode: ScanMode;
    onModeChange: (mode: ScanMode) => void;
    action: ScanAction;
    onActionChange: (action: ScanAction) => void;
    hidPageHasFocus: boolean;
    hidBuffer: string;
    isSoundOn: boolean;
    onSoundToggle: () => void;
    onAttendeeScanned: (attendeePublicId: string) => void;
    onOpenRecentScan?: (attendeePublicId: string) => void;
    recentScans: RecentScan[];
}

const relativeTime = (timestamp: number) => {
    const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSec < 5) return t`just now`;
    if (diffSec < 60) return t`${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t`${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return t`${diffHr}h ago`;
};

export const ScanTab = ({
                            mode,
                            onModeChange,
                            action,
                            onActionChange,
                            hidPageHasFocus,
                            hidBuffer,
                            isSoundOn,
                            onSoundToggle,
                            onAttendeeScanned,
                            onOpenRecentScan,
                            recentScans,
                        }: ScanTabProps) => {
    return (
        <div className={classes.wrap}>
            <div className={classes.actionToggle} role="radiogroup" aria-label={t`Scan action`}>
                <button
                    type="button"
                    role="radio"
                    aria-checked={action === "check-in"}
                    className={`${classes.actionBtn} ${action === "check-in" ? classes.actionCheckInActive : ""}`}
                    onClick={() => onActionChange("check-in")}
                    data-testid="check-in-scan-action-check-in"
                >
                    <IconLogin size={18}/>
                    <span>{t`Check in`}</span>
                </button>
                <button
                    type="button"
                    role="radio"
                    aria-checked={action === "check-out"}
                    className={`${classes.actionBtn} ${action === "check-out" ? classes.actionCheckOutActive : ""}`}
                    onClick={() => onActionChange("check-out")}
                    data-testid="check-in-scan-action-check-out"
                >
                    <IconLogout size={18}/>
                    <span>{t`Check out`}</span>
                </button>
            </div>

            <div className={`${classes.scanArea} ${action === "check-out" ? classes.scanAreaCheckOut : ""}`}>
                {action === "check-out" && (
                    <div className={classes.checkOutBanner}>
                        <IconLogout size={14}/>
                        <span>{t`Check-out mode`}</span>
                    </div>
                )}
                {mode === "camera" ? (
                    <InlineCameraScanner onAttendeeScanned={onAttendeeScanned}/>
                ) : (
                    <div className={classes.usbPane}>
                        <div className={classes.usbStatusRow}>
                            <span className={`${classes.statusDot} ${hidPageHasFocus ? classes.dotActive : classes.dotPaused}`}/>
                            <span className={classes.statusText}>
                                {hidPageHasFocus ? t`USB scanner listening` : t`USB scanner paused`}
                            </span>
                        </div>
                        <div className={classes.usbInstruction}>
                            {!hidPageHasFocus
                                ? t`Tap this screen to resume scanning`
                                : action === "check-out"
                                    ? t`Scan a ticket to check out an attendee`
                                    : t`Scan a ticket to check in an attendee`}
                        </div>
                        <div className={classes.buffer}>
                            {hidBuffer
                                ? <span className={classes.bufferText}>{hidBuffer}</span>
                                : <span className={classes.bufferPlaceholder}>{t`Waiting for scan…`}</span>}
                        </div>
                    </div>
                )}
            </div>

            <div className={classes.toolbar}>
                <div className={classes.modeToggle} role="tablist" aria-label={t`Scanner mode`}>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "usb"}
                        className={`${classes.modeBtn} ${mode === "usb" ? classes.modeActive : ""}`}
                        onClick={() => onModeChange("usb")}
                    >
                        <IconScan size={16}/>
                        <span>{t`USB`}</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={mode === "camera"}
                        className={`${classes.modeBtn} ${mode === "camera" ? classes.modeActive : ""}`}
                        onClick={() => onModeChange("camera")}
                    >
                        <IconCamera size={16}/>
                        <span>{t`Camera`}</span>
                    </button>
                </div>
                <ActionIcon
                    aria-label={isSoundOn ? t`Turn sound off` : t`Turn sound on`}
                    variant="default"
                    size="lg"
                    radius="xl"
                    onClick={onSoundToggle}
                    className={classes.soundBtn}
                >
                    {isSoundOn ? <IconVolume size={18}/> : <IconVolumeOff size={18}/>}
                </ActionIcon>
            </div>

            <div className={classes.recentSection}>
                <div className={classes.sectionHeader}>{t`Recent scans`}</div>
                {recentScans.length === 0 ? (
                    <div className={classes.empty}>
                        <Trans>Scanned tickets will appear here</Trans>
                    </div>
                ) : (
                    <div className={classes.recentList}>
                        {recentScans.slice(0, 8).map(scan => (
                            <button
                                type="button"
                                key={scan.id}
                                className={`${classes.recentItem} ${scan.status === "error" ? classes.recentError : ""} ${scan.status === "duplicate" || scan.status === "not_checked_in" ? classes.recentDuplicate : ""}`}
                                onClick={() => onOpenRecentScan?.(scan.code)}
                                disabled={!onOpenRecentScan || !scan.code.startsWith("A-")}
                            >
                                <div className={`${classes.indicator} ${classes[`indicator_${scan.status}`]}`}>
                                    {scan.status === "success" && <IconCheck size={14} stroke={3}/>}
                                    {scan.status === "duplicate" && <IconCheck size={14} stroke={3}/>}
                                    {scan.status === "checked_out" && <IconLogout size={14} stroke={2.5}/>}
                                    {scan.status === "not_checked_in" && <IconX size={14} stroke={3}/>}
                                    {scan.status === "error" && <IconX size={14} stroke={3}/>}
                                </div>
                                <div className={classes.recentMain}>
                                    <div className={classes.recentName}>{scan.name}</div>
                                    <div className={classes.recentMeta}>
                                        <span className={classes.recentCode}>{scan.code}</span>
                                        {scan.seatLabel && (
                                            <>
                                                <span className={classes.dot}>·</span>
                                                <span>{scan.seatLabel}</span>
                                            </>
                                        )}
                                        <span className={classes.dot}>·</span>
                                        <span>{relativeTime(scan.timestamp)}</span>
                                    </div>
                                </div>
                                {scan.status === "duplicate" && (
                                    <span className={classes.tagWarn}>{t`Already in`}</span>
                                )}
                                {scan.status === "checked_out" && (
                                    <span className={classes.tagOut}>{t`Checked out`}</span>
                                )}
                                {scan.status === "not_checked_in" && (
                                    <span className={classes.tagWarn}>{t`Not checked in`}</span>
                                )}
                                {scan.status === "error" && (
                                    <span className={classes.tagError}>{t`Failed`}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
