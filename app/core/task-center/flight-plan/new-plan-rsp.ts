// start region
interface DeviceModel {
    key: string;
    domain: string;
    type: string;
    sub_type: string;
    name: string;
    class: string;
}

interface Camera {
    available_camera_positions?: number[];
    camera_position?: number;
    camera_index: string;
}

interface Lens {
    available_lens_types: string[];
    lens_type: string;
}

interface CameraWithLens extends Camera {
    lens_list: Lens[];
}

interface Gateway {
    sn: string;
    callsign: string;
    device_model: DeviceModel;
    device_online_status: boolean;
    mode_code: number;
    camera_list: Camera[];
}

export interface Drone {
    sn: string;
    callsign: string;
    device_model: DeviceModel;
    device_online_status: boolean;
    mode_code: number;
    camera_list: CameraWithLens[];
}

interface ListElement {
    gateway: Gateway;
    drone: Drone;
}

export interface DeviceObjectRsp {
    list: ListElement[];
}
// end region

//start region
interface PayloadInformation {
    domain: string;
    type: string;
    lens_type: string;
}

export interface WayLine {
    id: string;
    name: string;
    size: number;
    payload_information: PayloadInformation[];
    device_model_key: string;
    template_types: string[];
    update_time: number;
}

export interface WayLineListRsp {
    list: WayLine[];
}

// end region
