export interface Request {
    /**
     * 开始时间，开始时间，秒级时间戳，立即任务不需要填，对于定时任务这个值代表任务执行时间。对于重复任务和连续任务这个值代表任务的开始时间。
     */
    begin_at?: number;
    /**
     * 连续任务的多个执行时间段，秒级时间戳，必须跟“begin_at”时间同一天。
     */
    continuous_task_periods?: Array<number[]>;
    /**
     * 算法类别
     */
    e_class_code_dict: EClassCodeDict;
    /**
     * 算法ai大类
     */
    e_model_type_id: number;
    /**
     * 算法规则，违建立即任务，填写{"front_image": "image_id"}
     */
    e_rule_dict: ERuleDict;
    /**
     * 结束时间，结束时间，秒级时间戳，重复/连续任务必须填写
     */
    end_at?: number;
    /**
     * 降落机场SN，非蛙跳任务可不填
     */
    landing_dock_sn: string;
    /**
     * 连续执行最低执行电量，>= 50 <= 100
     */
    min_battery_capacity?: number;
    /**
     * 任务名称
     */
    name: string;
    /**
     * 丢失信号后无人机动作
     */
    out_of_control_action_in_flight?: OutOfControlActionInFlight;
    /**
     * 平台项目id，公司平台项目id
     */
    project_id: number;
    /**
     * 重复任务的多个开始执行的时间，秒级时间戳，必须跟“begin_at”时间同一天。
     */
    recurring_task_start_time_list?: number[];
    /**
     * 任务重复模式
     */
    repeat_option?: RepeatOption;
    /**
     * 任务重复模式
     */
    repeat_type?: string;
    /**
     * 自动断点续飞
     */
    resumable_status?: string;
    /**
     * 返航高度
     */
    rth_altitude: number;
    /**
     * 返航模式
     */
    rth_mode?: RthMode;
    /**
     * 机场SN
     */
    sn: string;
    /**
     * 任务类型
     */
    task_type?: string;
    /**
     * 时区，TZ database中的时区名称
     */
    time_zone?: string;
    /**
     * 任务精度
     */
    wayline_precision_type?: WaylinePrecisionType;
    /**
     * 航线文件UUID
     */
    wayline_uuid: string;
    [property: string]: any;
}

/**
 * 算法类别
 */
export interface EClassCodeDict {
    /**
     * 违建为key为model_sign, 内空填building_change，其他算法为其他key与value
     */
    model_sign: string;
    [property: string]: any;
}

/**
 * 算法规则，违建立即任务，填写{"front_image": "image_id"}
 */
export interface ERuleDict {
    /**
     * 违建为file_path，其他算法为其他key,  同容 {"file_path": "image_id"}
     */
    file_path: string;
    [property: string]: any;
}

/**
 * 丢失信号后无人机动作
 */
export enum OutOfControlActionInFlight {
    ContinueTask = "continue_task",
    ReturnHome = "return_home",
}

/**
 * 任务重复模式
 */
export interface RepeatOption {
    /**
     * 每月执行日数组，每月第几天，1-31
     */
    days_of_month: number[];
    /**
     * 每周执行日数组，每周第几天，0-6，0=周日，1=周一
     */
    days_of_week: number[];
    /**
     * 重复间隔时间，最小1
     */
    interval: number;
    /**
     * 每周执行日数组，每周第几天，0-6，0=周日，1=周一
     */
    week_of_month: number[];
    [property: string]: any;
}

/**
 * 返航模式
 */
export enum RthMode {
    Optimal = "optimal",
    Preset = "preset",
}

/**
 * 任务精度
 */
export enum WaylinePrecisionType {
    Gnss = "gnss",
    Rtk = "rtk",
}