# Differences between dev mode and product mode

There are two extension modes: dev mode (unpacked mode) and product mode (packed mode). This memo lists the differences in APIs behavior between the two modes. If developers forget these, they will run into trouble after publishing.

| API | Dev Mode | Product Mode |
| ------------- | ------------- | ------------- |
| alarms  | no schedule limitation | at most once every 30 seconds (60 seconds in earlier version) |
| declarativeNetRequest | `testMatchOutcome()` and `onRuleMatchedDebug` are only available for unpacked extensions | they are undefined |
| option: "Allow access to file URLs" | enabled by default | disabled by default, and doesn't display if the extension does not have `file:///*` permission |

