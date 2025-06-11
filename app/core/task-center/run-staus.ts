export enum TaskStatus {
    INIT = 0,

    SUCCESS = 200,
    ANALYZING = 201,

    DOWNLOADED = 202,
    DOWNLOADING = 203,

    RESOURCE_WAITING = 204,

    FLIGHT_EXECUTING = 225,
    FLIGHT_SUCCESS = 226,

    FAILED = 500
}

export enum TaskTypeEnum {
    data_task_cd_building_change = 0,
    data_task_obj_video = 20,

    flight_cd_building_change = 100,
    flight_obj_video = 120,
}