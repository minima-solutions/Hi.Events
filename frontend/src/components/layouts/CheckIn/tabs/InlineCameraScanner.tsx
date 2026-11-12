import {useEffect, useRef, useState} from "react";
import QrScanner from "qr-scanner";
import {t, Trans} from "@lingui/macro";
import {Anchor, Button, Menu} from "@mantine/core";
import {IconBulb, IconBulbOff, IconCameraRotate} from "@tabler/icons-react";
import classes from "./InlineCameraScanner.module.scss";

const RESCAN_AFTER_ABSENT_MS = 1500;

interface Props {
    onAttendeeScanned: (attendeePublicId: string) => void;
}

export const InlineCameraScanner = ({onAttendeeScanned}: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isFlashAvailable, setIsFlashAvailable] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [cameraList, setCameraList] = useState<QrScanner.Camera[]>();
    const onAttendeeScannedRef = useRef(onAttendeeScanned);
    const lastSeenAtRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        onAttendeeScannedRef.current = onAttendeeScanned;
    }, [onAttendeeScanned]);

    const handleDecode = (code: string) => {
        const now = Date.now();
        const lastSeenAt = lastSeenAtRef.current.get(code);
        lastSeenAtRef.current.set(code, now);
        if (lastSeenAt !== undefined && now - lastSeenAt < RESCAN_AFTER_ABSENT_MS) {
            return;
        }
        onAttendeeScannedRef.current(code);
    };

    const startScanner = async () => {
        try {
            const permissionStream = await navigator.mediaDevices.getUserMedia({video: true});
            permissionStream.getTracks().forEach(track => track.stop());
            if (videoRef.current) {
                qrScannerRef.current = new QrScanner(videoRef.current, (result) => {
                    const code = result.data.trim();
                    if (code) {
                        handleDecode(code);
                    }
                }, {
                    maxScansPerSecond: 15,
                    preferredCamera: "environment",
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                });
                qrScannerRef.current.start();
            }
        } catch (error) {
            setPermissionDenied(true);
            console.error(error);
        }
    };

    const stopScanner = () => {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }
    };

    useEffect(() => {
        startScanner().then(async () => {
            if (qrScannerRef.current) {
                const hasFlash = await qrScannerRef.current.hasFlash();
                setIsFlashAvailable(hasFlash);
            }
            const cameras = await QrScanner.listCameras(true);
            setCameraList(cameras);
        });
        return () => {
            stopScanner();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFlashToggle = () => {
        if (!qrScannerRef.current || !isFlashAvailable) return;
        if (isFlashOn) {
            qrScannerRef.current.turnFlashOff();
        } else {
            qrScannerRef.current.turnFlashOn();
        }
        setIsFlashOn(!isFlashOn);
    };

    const handleCameraSelect = (camera: QrScanner.Camera) => {
        qrScannerRef.current?.setCamera(camera.id)
            .then(async () => {
                if (qrScannerRef.current) {
                    const hasFlash = await qrScannerRef.current.hasFlash();
                    setIsFlashAvailable(hasFlash);
                }
            });
    };

    const requestPermission = async () => {
        setPermissionDenied(false);
        await startScanner();
    };

    if (permissionDenied) {
        return (
            <div className={classes.permissionDenied}>
                <p>
                    <Trans>
                        Camera permission was denied. <Anchor onClick={requestPermission}>Request permission</Anchor> again,
                        or grant this page camera access in your browser settings.
                    </Trans>
                </p>
            </div>
        );
    }

    return (
        <div className={classes.scanner}>
            <video ref={videoRef} className={classes.video} playsInline/>

            <div className={classes.reticle}>
                <span className={`${classes.corner} ${classes.tl}`}/>
                <span className={`${classes.corner} ${classes.tr}`}/>
                <span className={`${classes.corner} ${classes.bl}`}/>
                <span className={`${classes.corner} ${classes.br}`}/>
            </div>

            <div className={classes.controls}>
                {isFlashAvailable && (
                    <Button
                        onClick={handleFlashToggle}
                        variant="default"
                        size="compact-sm"
                        radius="xl"
                        className={classes.control}
                        leftSection={isFlashOn ? <IconBulb size={14}/> : <IconBulbOff size={14}/>}
                    >
                        {isFlashOn ? t`Flash on` : t`Flash off`}
                    </Button>
                )}
                {cameraList && cameraList.length > 1 && (
                    <Menu shadow="md" width={220}>
                        <Menu.Target>
                            <Button
                                variant="default"
                                size="compact-sm"
                                radius="xl"
                                className={classes.control}
                                leftSection={<IconCameraRotate size={14}/>}
                            >
                                {t`Camera`}
                            </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Label>{t`Select camera`}</Menu.Label>
                            {cameraList.map((camera, index) => (
                                <Menu.Item key={index} onClick={() => handleCameraSelect(camera)}>
                                    {camera.label}
                                </Menu.Item>
                            ))}
                        </Menu.Dropdown>
                    </Menu>
                )}
            </div>
        </div>
    );
};
