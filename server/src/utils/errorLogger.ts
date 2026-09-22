export const sendErrorLogEvent = (
  eventCode: string,
  eventTitle: string,
  eventMessage: string,
) => {
  console.log(
    `Error Log Event - Code: ${eventCode}, Title: ${eventTitle}, Message: ${eventMessage}`,
  );
};
