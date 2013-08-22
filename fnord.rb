require "fnordmetric"

FnordMetric.namespace :store do
  #hide_active_users
  

 widget 'Cloud Files View',
    :title => "Real time User views log PUSH per second",
    :gauges => [:files_index_display_per_second],
    :type => :timeline,
    :width => 100,
    :autoupdate => 1

 widget 'Cloud files view - Count',
    :title => "Real time User views log PUSH per second",
    :gauges => [:files_index_display_per_second],
    :type => :numbers,
    :width => 100,
    :autoupdate => 1,
    :offsets => [1, 5, 10, 30, 60]

 widget 'File Upload - Count',
    :title => "Real time File Uploads per Second",
    :gauges => [:file_uploads_per_second],
    :type => :numbers,
    :width => 100,
    :autoupdate => 1,
    :offsets => [1, 5, 10, 30, 60]

 widget 'File Delete - Count',
    :title => "Real time File Deletion count per Second",
    :gauges => [:deleted_files_per_second],
    :type => :numbers,
    :width => 100,
    :autoupdate => 1,
    :offsets => [1, 5, 10, 30, 60]

  widget 'File View - Count',
    :title => "Real time File View count per Second",
    :gauges => [:files_display_per_second],
    :type => :numbers,
    :width => 100,
    :autoupdate => 1,
    :offsets => [1, 5, 10, 30, 60]

  toplist_gauge :file_upload_names, title: "File Uploads"

  gauge :file_uploads_per_second, tick: 1.second
  widget "File Uploads - Realtime Log PUSH",
    title: "File Uploads per Second",
    type: :timeline,
    width: 100,
    gauges: :file_uploads_per_second,
    include_current: true,
    autoupdate: 1
  event :file_upload do
    observe :file_upload_names, data[:upload_file_name]
    incr :file_uploads_per_second
  end

#####################

  toplist_gauge :deleted_file_names, title: "Deleted Files"

  gauge :deleted_files_per_second, tick: 1.second
    widget "Deleted Files - Realtime Log PUSH",
      title: "File Deletes per Second",
      type: :timeline,
      width: 100,
      gauges: :deleted_files_per_second,
      include_current: true,
      autoupdate: 1


  event :delete_uploaded_file do
    observe :deleted_file_names, data[:delete_uploaded_file]
    incr :deleted_files_per_second
  end

###########################

  toplist_gauge :files_index_view_1, title: "Distributed Files"

  gauge :files_index_display_per_second, tick: 1.second
    widget "Distributed Files Log PUSH",
      title: "Distributed Files",
      type: :timeline,
      width: 100,
      gauges: :files_index_display_per_second,
      include_current: true,
      autoupdate: 1


  event :files_index_view do
    observe :files_index_view_1, data[:files_index_view]
    incr :files_index_display_per_second
  end

  ###########################

  toplist_gauge :files_view_1, title: "View file"

  gauge :files_display_per_second, tick: 1.second
    widget "View File Log PUSH",
      title: "View File",
      type: :timeline,
      width: 100,
      gauges: :files_display_per_second,
      include_current: true,
      autoupdate: 1


  event :specific_file_view do
    observe :files_view_1, data[:specific_file_view]
    incr :files_display_per_second
  end



end

FnordMetric::Web.new(port: 9999)
FnordMetric::Worker.new
FnordMetric.run