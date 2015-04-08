# 1.1.2 (2015-04-08)

  * 0fd199b exception handling: pass an error object for better stack traces

# 1.1.1 (2015-04-07)

  * bugfix: evaluate keys after error check (will raise a TypeError otherwise).

# 1.1.0 (2015-03-17)

  * b9016fb Additional debug message.
  * 5796202 Fixed refresher initialization.
  * da1e3ad Added `pre-commit` workflow.
  * 3b50289 Optimzed the `refresh process`. The interval will now be started when there was a `need` call before.
  * 370097f Implemented mechanism for refreshing an internal connection information cache.

# 1.0.0 (2015-03-16)

  * Implemented mechanism for fetching connection details of particular service.
  * Implemented mechanism for advertising services.
