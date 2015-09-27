var dataTypes = {
    status: "Status",
    activityType: "ActivityType",
    workOrder: "9DN",
    accountNumber: "9DN",
    firstName: "String",
    lastName: "String",
    address: "String",
    city: "String",
    zip: "9DN",
    phone: "12DN",
    timeSlot: "2DN-2DN",
    start: "24H:MM",
    end: "24H:MM",
    problemCode: "ProblemCode",
    workOrderType: "TC",
    workOrderClass: "C"
};

var Status = {
    values: [
        "Started",
        "Not Done",
        "Suspended",
        "Completed"
    ],
    default: values[0]
}