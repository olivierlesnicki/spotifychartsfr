module.exports = (charts, previous_charts) => {
  console.log("INFO", "get charts deltas");
  return charts.map(chart => {
    const previous_chart = previous_charts.find(({ id }) => id === chart.id);
    const delta = previous_chart ? previous_chart.position - chart.position : 0;

    return {
      ...chart,
      is_entry: !previous_chart,
      delta
    };
  });
};
